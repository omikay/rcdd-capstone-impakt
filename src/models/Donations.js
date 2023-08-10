const mongoose = require('mongoose');

const { Schema } = mongoose;

const donationSchema = new Schema({
  donor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  event: { type: Schema.Types.ObjectId, ref: 'Event', required: true },
  amount: { type: Number, required: true },
  donationDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Donations', donationSchema);
