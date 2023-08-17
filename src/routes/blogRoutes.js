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
router.post('/blogPosts/new', createBlog);

// Update a blog post
router.patch('/blogPosts/:id/update', updateBlog);

// Delete a blog post
router.delete('/blogPosts/:id/delete', deleteBlog);

// Get a blog post by ID
router.get('/blogPosts/:id', getBlogById);

// Get all blog posts
router.get('/blogPosts', getAllBlogs);

module.exports = router;
