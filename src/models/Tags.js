const mongoose = require('mongoose');

const { Schema } = mongoose;

const tagSchema = new Schema({
  tagName: String,
});

module.exports = mongoose.model('Tags', tagSchema);
