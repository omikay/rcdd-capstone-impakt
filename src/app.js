const express = require('express');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const eventRoutes = require('./routes/eventRoutes');
const connectToMongo = require('./config/db');

const app = express();
const port = 5007;

app.use(morgan('dev'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cookieParser());

app.use('/', userRoutes);
app.use('/', eventRoutes);

app.use((err, req, res) => {
  // console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});
const server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
  connectToMongo();
});

afterAll(async () => {
  // Cleanup code to close the server
  await server.close();
});

module.exports = app;
