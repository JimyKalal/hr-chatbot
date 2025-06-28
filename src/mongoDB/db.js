const mongoose = require("mongoose");
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log('🔗 MONGO_URI is:', process.env.MONGO_URI);
        console.log(`MongoDB connected successfully at ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error connecting DB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
