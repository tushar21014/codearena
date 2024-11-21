const mongoose = require('mongoose');

async function connectToMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB CodeArena Server');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
    }
}

connectToMongo();

module.exports = connectToMongo;