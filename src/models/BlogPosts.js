const mongoose = require('mongoose');

const { Schema } = mongoose;

const blogPostSchema = new Schema({
  author: { type: Schema.Types.ObjectId, ref: 'Users' },
  title: String,
  bannerImage: String, // the URL of the image
  category: { type: Schema.Types.ObjectId, ref: 'Categories' },
  shortDescription: String,
  bodyText: String,
  postDate: Date,
  lastModified: {
    type: Date,
    default() {
      return this.postDate || new Date();
    },
  },
});

module.exports = mongoose.model('BlogPosts', blogPostSchema);
