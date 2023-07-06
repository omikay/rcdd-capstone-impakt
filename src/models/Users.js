const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  googleAccountID: String,
  tel: Number,
  age: { type: Number, required: true },
  profile_pic: String,
  interest_ids: [{ type: Schema.Types.ObjectId, ref: 'Tags' }],
  password: { type: String, required: true },
});

module.exports = mongoose.model('Users', userSchema);
