const mongoose = require('mongoose');
const { Schema } = mongoose;

const donationSchema = new Schema({
  user_id: { type: Schema.Types.ObjectId, ref: 'Users', required: true },
  event_id: { type: Schema.Types.ObjectId, ref: 'Events', required: true },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Donations', donationSchema);


