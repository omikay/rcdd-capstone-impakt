const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  googleId: String,
  name: String,
  email: String,
  password: String,
  isVerified: {
    type: Boolean,
    default: false,
  },
  dob: Date, // date of birth
  phone: String,
  location: {
    provinceState: String,
    country: String,
  },
  profilePicture: String,
  interests: [{ type: Schema.Types.ObjectId, ref: 'Tags' }],
  joinedEvents: [{ type: Schema.Types.ObjectId, ref: 'Events' }],
  userType: String, // 'admin' or 'regular'
  createdEvents: [{ type: Schema.Types.ObjectId, ref: 'Events' }],
  blogPosts: [{ type: Schema.Types.ObjectId, ref: 'BlogPosts' }],
  donations: [{ type: Schema.Types.ObjectId, ref: 'Donations' }],
  accountCreatedOn: Date,
});

module.exports = mongoose.model('Users', userSchema);
