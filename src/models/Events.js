const mongoose = require('mongoose');

const { Schema } = mongoose;

const eventSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'Users' },
  title: String,
  description: String,
  bannerImage: String, // the URL of the image
  location: String, // google map location
  startDate: Date,
  endDate: Date,
  ageLimit: {
    lower: Number,
    upper: Number
  },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tags' }],
  capacity: Number,
  participants: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
});

module.exports = mongoose.model('Events', eventSchema);
