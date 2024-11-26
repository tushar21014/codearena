const mongoose = require('mongoose');

const { Schema } = mongoose;


const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: "user",
        required: true
    },
    // phone: {
    //     type: String,
    //     required: true
    // },
    verify_token: {
        type: String
    },
    isOnline: {
        type: Boolean,
        default: false,
    },
    isFree: {
        type: Boolean,
        default: true,
        required: true
    },
    date: {
        type: Date,
        default: Date.now,
        required: true

    },
    friends: [{
        type: Schema.Types.ObjectId,
        ref: 'Users'
    }]
});

const user = mongoose.model('Users', userSchema)
module.exports = user;