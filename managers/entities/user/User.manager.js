const bcrypt = require("bcrypt");
module.exports = class User {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.usersCollection     = "users";
        this.httpExposed         = ['post=register', 'post=login', 'get=read', 'patch=update', 'put=update', 'delete=delete'];
    }

    async register({username, email, password}){
        const user = {username, email, password};

        // Data validation
        let result = await this.validators.user.register(user);
        if(result) return result;

        // Creation Logic
        let createdUser     = new this.mongomodels.user({username, email, password});
        await createdUser.save();
        let token       = this.tokenManager.genShortToken({userId: createdUser._id, role: createdUser.role });

        // Response
        return {
            code: 201,
            user: createdUser,
            token
        };
    }

    async login({email, password}){
        let user = await this.mongomodels.user.findOne({email}).exec();
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return {error: "Invalid email/password"}
        }

        let token = this.tokenManager.genShortToken({userId: user._id, role: user.role });

        return {token};
    }

    async read({entity_id, __token}) {
        const jwtUser = __token;
        if (!entity_id) {
            return {error: 'userId in url is empty'}
        }

        const userId = entity_id === 'me' ? jwtUser.userId : entity_id;

        if (entity_id !== 'me' && jwtUser.role !== 'super_admin') {
            return {
                error: 'forbidden',
                code: 403
            }
        }

        const user = await this.mongomodels.user.findById(userId).exec();

        return {user};
    }


    async update({old_password, new_password, role, entity_id, __token}) {
        const jwtUser = __token;
        if (!entity_id) {
            return {error: 'userId in url is empty'}
        }
        if (entity_id === jwtUser.userId) {
            entity_id = 'me';
        }

        const userId = entity_id === 'me' ? jwtUser.userId : entity_id;
        const user = await this.mongomodels.user.findById(userId).exec();

        if (entity_id === 'me') {
            if (new_password && old_password && bcrypt.compareSync(old_password, user.password)) {
                user.password = new_password;
            }
        } else {
            if (jwtUser.role === 'super_admin') {
                if (new_password) user.password = new_password;
                if (role) user.role = role;
            }
        }

        await user.save();
        return {user};
    }


    async delete({entity_id, __token}) {
        const jwtUser = __token;
        if (!entity_id) {
            return {error: 'userId in url is empty'}
        }

        if (jwtUser.role !== 'super_admin') {
            return {
                error: 'forbidden',
                code: 403
            }
        }

        const deleteResult = await this.mongomodels.user.deleteOne({_id: entity_id}).exec();

        return {deleteResult};
    }

}
