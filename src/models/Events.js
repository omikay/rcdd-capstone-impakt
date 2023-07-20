const mongoose = require('mongoose');

const { Schema } = mongoose;

const eventSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  bannerImage: String, // the URL of the image
  location: { type: String, required: true }, // google map location
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  ageLimit: {
    lower: Number,
    upper: Number,
  },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tags' }],
  capacity: Number,
  participants: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  donations: [{ type: Schema.Types.ObjectId, ref: 'Donations' }],
});

module.exports = mongoose.model('Events', eventSchema);
