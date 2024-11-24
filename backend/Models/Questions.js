const mongoose = require('mongoose');

const { Schema } = mongoose;


const questionsSchema = new Schema({
    Title: {
        type: String,
        required: true
    },
    Difficulty: {
        type: String,
        required: true
    },
    Accuracy: {
        type: Number,
        required: true
    },
    Content: {
        type: String,
        required: true
    },
    URL: {
        type: String,
        required: true
    }
});

const questions = mongoose.model('questions', questionsSchema)
module.exports = questions;