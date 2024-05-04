const bcrypt = require("bcrypt");
module.exports = class School {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.httpExposed         = ['post=register', 'get=read', 'patch=update', 'put=update', 'delete=delete'];
    }

    async register({name, schoolAdminId, __token}){
        if (__token.role !== 'super_admin') {
            return {
                error: 'forbidden',
                code: 403
            }
        }

        const school = {name, schoolAdminId};

        let result = await this.validators.school.register(school);
        if(result) return result;

        // Creation Logic
        let createdSchool = new this.mongomodels.school({name, admin: schoolAdminId});
        await createdSchool.save();

        // Response
        return {school: createdSchool};
    }

    async read({entity_id, __token}) {
        if (!entity_id) {
            return {error: 'schoolId in url is empty'}
        }

        const school = await this.mongomodels.school.findById(entity_id).exec();
        return {school};
    }


    async update({name, schoolAdminId, entity_id, __token}) {
        if (!entity_id) {
            return {error: 'schoolId in url is empty'}
        }
        if (__token.role !== 'super_admin') {
            return {
                error: 'forbidden',
                code: 403
            }
        }

        const school = await this.mongomodels.school.findById(entity_id).exec();
        if (name) school.name = name;
        if (schoolAdminId) school.admin = schoolAdminId;

        await school.save();

        return {school};
    }


    async delete({entity_id, __token}) {
        const jwtUser = __token;
        if (!entity_id) {
            return {error: 'schoolId in url is empty'}
        }

        if (jwtUser.role !== 'super_admin') {
            return {
                error: 'forbidden',
                code: 403
            }
        }

        const deleteResult = await this.mongomodels.school.deleteOne({_id: entity_id}).exec();
        await this.mongomodels.classroom.deleteMany({school: entity_id}).exec();

        return {deleteResult};
    }

}
