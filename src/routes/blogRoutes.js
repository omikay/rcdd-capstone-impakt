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
router.post('/blogPosts/new', isAuthorized, createBlog);

// Render the blog post form
router.get('/blogPosts/:id/update', (req, res) => {
  res.render('updateBlogPost');
});

// Update a blog post
router.patch('/blogPosts/:id/update', isAuthorized, updateBlog);

// Delete a blog post
router.delete('/blogPosts/:id/delete', isAuthorized, deleteBlog);

// Get a blog post by ID
router.get('/blogPosts/:id', getBlogById);

// Get all blog posts
router.get('/blogPosts', getAllBlogs);

module.exports = router;
