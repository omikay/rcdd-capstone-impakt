const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const path = require('path');
const dotenv = require('dotenv'); // Import dotenv module

dotenv.config(); // Load environment variables from .env file

const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const donationRoutes = require('./routes/donationRoutes');
const connectToMongo = require('./config/db');

const app = express();
const port = 8080;

// View engine setup
app.set('views', path.join(__dirname, 'views')); // Set the views directory
app.set('view engine', 'ejs'); // Use EJS as the view engine

// Middleware
app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/users', userRoutes);
app.use('/events', eventRoutes);
app.use('/donations', donationRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

const server = app.listen(port, () => {
  connectToMongo();
});

module.exports = server;
