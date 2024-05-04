const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const BCRYPT_HASH_ROUNDS = 10;

const schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowerCase: true
    },
    username: {
        type: String,
        required: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        set:  v => bcrypt.hashSync(v, BCRYPT_HASH_ROUNDS)
    },
    role: {
        type: String,
        enum: ['student', 'school_admin', 'super_admin'],
        required: true,
        default: 'student'
    },
});

module.exports = mongoose.model("User", schema);
