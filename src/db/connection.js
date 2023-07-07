const mongoose = require('mongoose');

const url = process.env.MONGO_URL;

const connectToMongo = () => {
  mongoose.connect(url, { useNewUrlParser: true });

  const db = mongoose.connection; // Declare the 'db' variable

  db.once('open', () => {
    console.log('Database connected: ', url);
  });

  db.on('error', (err) => {
    console.error('Database connection error: ', err);
  });
};

module.exports = connectToMongo;
