module.exports = class User { 

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators; 
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.usersCollection     = "users";
        this.httpExposed         = ['post=register'];
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

}
