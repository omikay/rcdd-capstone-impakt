const mongoose = require('mongoose');

const url = process.env.MONGO_URL;

const connectToMongo = () => {
  mongoose.connect(url, { useNewUrlParser: true });

  const db = mongoose.connection;

  db.once('open', () => {
    console.log('Database connected: ', url);
  });

  db.on('error', () => {
    // console.error('Database connection error:', err);
    process.exit(1);
  });
};

module.exports = connectToMongo;
