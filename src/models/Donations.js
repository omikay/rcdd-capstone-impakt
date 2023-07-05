
const mongoose = require('mongoose');
const { Schema } = mongoose;

const donationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event_id: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donation', donationSchema);
