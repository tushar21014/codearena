const mongoose = require('mongoose');

const { Schema } = mongoose;


const friendSchema = new Schema({
    userIds: [{
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }]
});

const friend = mongoose.model('Friends', friendSchema)
module.exports = friend;