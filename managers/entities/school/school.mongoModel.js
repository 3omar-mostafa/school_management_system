const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    admin: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: "User",
    },
});

schema.options.toJSON = {
    transform: function(doc, ret, options) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
};

module.exports = mongoose.model("School", schema);
