const bcrypt = require("bcrypt");
module.exports = class User {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.usersCollection     = "users";
        this.httpExposed         = ['post=register', 'post=login'];
    }

    async register({username, email, password}){
        const user = {username, email, password};

        // Data validation
        let result = await this.validators.user.register(user);
        if(result) return result;

        // Creation Logic
        let createdUser     = new this.mongomodels.user({username, email, password});
        await createdUser.save();
        let longToken       = this.tokenManager.genLongToken({userId: createdUser._id, role: createdUser.role });

        // Response
        return {
            user: createdUser,
            longToken
        };
    }

    async login({email, password}){
        let user = await this.mongomodels.user.findOne({email}).exec();
        if (!user || !bcrypt.compareSync(password, user.password)) {
            return {error: "Invalid email/password"}
        }

        let longToken = this.tokenManager.genLongToken({userId: user._id, role: user.role });

        return {longToken};
    }

}
