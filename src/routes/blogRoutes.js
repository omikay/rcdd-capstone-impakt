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
// Create a new blog post
router.post('/blogPost', isAuthorized, createBlog);

// Update a blog post
router.patch('/blogPosts/:blogPostId/update',isAuthorized, updateBlog);

// Delete a blog post
router.delete('/blogPosts/:blogPostId',isAuthorized, deleteBlog);

// Get a blog post by ID
router.get('/blogPosts/:blogPostId',isAuthorized, getBlogById);

// Get all blog posts
router.get('/blogPosts',isAuthorized, getAllBlogs);

module.exports = router;
