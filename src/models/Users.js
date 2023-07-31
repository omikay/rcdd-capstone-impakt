const mongoose = require('mongoose');

const { Schema } = mongoose;

const userSchema = new Schema({
  googleId: String, // id returned by Google OAuth, null if not connected
  name: String,
  email: String,
  password: String, // hashed password, null if signed up with Google OAuth
  isVerified: {
    type: Boolean,
    default: false,
  }, // null if signed up with Google OAuth
  dob: Date, // date of birth
  phone: String,
  location: {
    provinceState: String,
    country: String,
  },
  profilePicture: String, // the URL of the image
  interests: [{ type: Schema.Types.ObjectId, ref: 'Tags' }],
  events: [{ type: Schema.Types.ObjectId, ref: 'Events' }],
  userType: String, // 'admin' or 'regular'
  createdEvents: [{ type: Schema.Types.ObjectId, ref: 'Events' }],
  blogPosts: [{ type: Schema.Types.ObjectId, ref: 'BlogPosts' }],
  donations: [{ type: Schema.Types.ObjectId, ref: 'Donations' }],
  accountCreatedOn: Date,
});

module.exports = mongoose.model('Users', userSchema);
