const mongoose = require('mongoose');

const { Schema } = mongoose;

const eventSchema = new Schema({
  creator: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  bannerImage: String,
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  ageLimit: {
    lower: { type: Number },
    upper: { type: Number },
  },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tags' }],
  capacity: Number,
  participants: [{ type: Schema.Types.ObjectId, ref: 'Users' }],
  donations: [{ type: Schema.Types.ObjectId, ref: 'Donations' }],
});

module.exports = mongoose.model('Events', eventSchema);
