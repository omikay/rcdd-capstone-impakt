const express = require('express');
const userRoutes = require('./routes/userRoutes');
const connectDB = require('./db/connection');
const app = express();

connectDB.connect().then((msg) => console.log(msg));


app.use('/api/user', userRoutes);


const port = process.env.NODE_LOCAL_PORT;

app.listen(PORT, () => {
console.log(`Server is running on port ${port}.`);
});

module.exports = app;