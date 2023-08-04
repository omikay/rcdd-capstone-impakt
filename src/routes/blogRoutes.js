const express = require('express');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();
const {
  createBlog,
  updateBlog,
  deleteBlog,
  getBlogById,
  getAllBlogs,
} = require('../controllers/blogController');

// Render the blog post form
router.get('/blogPosts/new', (req, res) => {
  res.render('createBlog');
});

// Create a new blog post
router.post('/blogPosts/new', isAuthorized, createBlog);

// Render the blog post form
router.get('/blogPosts/:blogPostId/update', (req, res) => {
  res.render('updateBlogPost');
});

// Update a blog post
router.patch('/blogPosts/:blogPostId/update', isAuthorized, updateBlog);

// Delete a blog post
router.delete('/blogPosts/:blogPostId/delete', isAuthorized, deleteBlog);

// Get a blog post by ID
router.get('/blogPosts/:blogPostId', getBlogById);

// Get all blog posts
router.get('/blogPosts', getAllBlogs);

module.exports = router;
