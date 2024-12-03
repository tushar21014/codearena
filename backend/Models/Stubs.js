const mongoose = require('mongoose');

const { Schema } = mongoose;


const stubsSchema = new Schema({
    question: {
        type: Schema.Types.ObjectId,
        ref: 'questions', // Match the collection name
        required: true,
    },
    cpp: {
        type: String,
    },
    python: {
        type: String,
    },
    java: {
        type: String,
    },
});

const Stub = mongoose.model('stub', stubsSchema);
module.exports = Stub;
