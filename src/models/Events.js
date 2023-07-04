const mongoose = require('mongoose');
const { Schema } = mongoose;

const eventSchema = new Schema({
  host_id: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  banner: String,
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], index: '2dsphere' }
  },
  start_datetime: { type: Date, required: true },
  end_datetime: { type: Date, required: true },
  lower_age_lim: Number,
  upper_age_lim: Number,
  tag_ids: [{ type: Schema.Types.ObjectId, ref: 'Tags' }],
  capacity: Number,
  participants_id: [{ type: Schema.Types.ObjectId, ref: 'Users' }]
});

module.exports = mongoose.model('Events', eventSchema);
