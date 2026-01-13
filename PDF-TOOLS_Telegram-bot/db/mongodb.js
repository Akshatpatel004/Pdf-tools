const mongoose = require('mongoose')
require("dotenv").config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.mongo_connect_url);
        console.log('MongoDB Connected Successfully');
    } catch (error) {
        console.error('MongoDB Connection Error:', error.message);
        process.exit(1);
    }
};

module.exports = connectDB;