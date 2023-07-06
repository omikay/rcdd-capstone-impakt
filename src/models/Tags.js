const mongoose = require('mongoose');

const { Schema } = mongoose;

const tagSchema = new Schema({
  tag_name: { type: String, required: true },
});

module.exports = mongoose.model('Tags', tagSchema);
