const mongoose = require('mongoose');

const url = process.env.MONGO_URL;

const connectDB = async () => {
    try {
      await mongoose.connect(url, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useCreateIndex: true,
        useFindAndModify: false,
      });
  
      console.log('MongoDB connection established');
    } catch (error) {
      console.error(`Error: ${error.message}`);
      process.exit(1);
    }
  };
  
  module.exports = connectDB;