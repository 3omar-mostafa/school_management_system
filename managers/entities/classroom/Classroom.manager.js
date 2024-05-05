const bcrypt = require("bcrypt");
const __ = require("lodash/fp/__");
module.exports = class Classroom {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.httpExposed         = ['post=create', 'get=read', 'get=getMyClasses', 'patch=update', 'put=update', 'put=enroll', 'put=unenroll', 'delete=delete'];
    }

    async create({name, schoolId, __token}){
        if (!['super_admin', 'school_admin'].includes(__token.role)) {
            return {
                error: 'forbidden',
                code: 403
            }
        }

        // Data validation
        let result = await this.validators.classroom.create({name, schoolId});
        if(result) return result;

        const school = await this.mongomodels.school.findById(schoolId).exec();

        if (!school) {
            return {
                error: 'School not found',
                code: 404
            }
        }

        const classroom = await this.mongomodels.classroom.findOne({name, school: schoolId});
        if (classroom) {
            return {
                error: 'Classroom already exists',
                code: 400
            }
        }
        
        // Creation Logic
        let createdClassroom = new this.mongomodels.classroom({name, school: schoolId});
        await createdClassroom.save();

        // Response
        return {code: 201, classroom: createdClassroom};
    }
    

    async read({entity_id, __token}) {
        if (!entity_id) {
            return {error: 'classroomId in url is empty'}
        }

        const classroom = await this.mongomodels.classroom.findById(entity_id).exec();

        return {classroom};
    }

    async getMyClasses({__token}) {
        const classes = await this.mongomodels.classroom.find({"students": {$elemMatch: {$eq: __token.userId}}}).exec();
        return {classes};
    }

    async update({name, entity_id, __token}) {
        const jwtUser = __token;
        if (!entity_id) {
            return {error: 'classroomId in url is empty'}
        }

        if (!['super_admin', 'school_admin'].includes(__token.role)) {
            return {
                error: 'forbidden',
                code: 403
            }
        }

        const classroom = await this.mongomodels.classroom.findById(entity_id).exec();

        if (name) classroom.name = name;

        await classroom.save();
        return {classroom};
    }

    async enroll({studentId, entity_id, __token}) {
        if (!entity_id) {
            return {error: 'classroomId in url is empty'}
        }

        if (!['super_admin', 'school_admin'].includes(__token.role)) {
            return {
                error: 'forbidden',
                code: 403
            }
        }
        const classroom = await this.mongomodels.classroom.findById(entity_id).exec();

        if (classroom.students.includes(studentId)) {
            return {
                error: 'Student already enrolled with this classroom',
                code: 400
            }
        }
        classroom.students.push(studentId);
        await classroom.save();
        return {classroom};
    }


    async unenroll({studentId, entity_id, __token}) {
        if (!entity_id) {
            return {error: 'classroomId in url is empty'}
        }

        if (!['super_admin', 'school_admin'].includes(__token.role)) {
            return {
                error: 'forbidden',
                code: 403
            }
        }
        const classroom = await this.mongomodels.classroom.findById(entity_id).exec();

        if (!classroom.students.includes(studentId)) {
            return {
                error: 'Student is not enrolled with this classroom',
                code: 400
            }
        }
        classroom.students = classroom.students.filter(item => item != studentId);
        await classroom.save();
        return {classroom};
    }

    async delete({entity_id, __token}) {
        const jwtUser = __token;
        if (!entity_id) {
            return {error: 'classroomId in url is empty'}
        }

        let deleteResult = null;

        if (__token.role === 'super_admin') {
            deleteResult = await this.mongomodels.classroom.deleteOne({_id: entity_id}).exec();
        } else if (__token.role === 'school_admin') {
            let school = await this.mongomodels.school.findOne({admin: __token.userId}).exec();
            deleteResult = await this.mongomodels.classroom.deleteOne({_id: entity_id, school: school._id}).exec();
        } else {
            return {
                error: 'forbidden',
                code: 403
            }
        }

        return {deleteResult};
    }

}
