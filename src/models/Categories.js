const mongoose = require('mongoose');

const { Schema } = mongoose;

const categorySchema = new Schema({
  categoryName: String,
});

module.exports = mongoose.model('Categories', categorySchema);
