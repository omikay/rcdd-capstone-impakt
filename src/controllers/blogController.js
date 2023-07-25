const User = require('../models/Users');
const BlogPost = require('../models/BlogPosts');
const Category = require('../models/Categories');

const createBlog = async (req, res) => {
  const { title, bannerImage, category, shortDescription, bodyText } = req.body;
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.userType !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const existingCategory = await Category.findById(category);
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    const newBlogPost = new BlogPost({
      author: user.id,
      title,
      bannerImage,
      category,
      shortDescription,
      bodyText,
    });
    const savedBlogPost = await newBlogPost.save();
    return res.status(201).json(savedBlogPost);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

const updateBlog = async (req, res) => {
  const { id } = req.params;
  const updatedBlogData = req.body;
  try {
    const existingBlogPost = await BlogPost.findById(id);
    if (!existingBlogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    // Check if user is an admin
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.userType !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const updatedBlogPost = await BlogPost.findByIdAndUpdate(
      id,
      {
        $set: {
          title: updatedBlogData.title,
          bannerImage: updatedBlogData.bannerImage,
          category: updatedBlogData.category,
          shortDescription: updatedBlogData.shortDescription,
          bodyText: updatedBlogData.bodyText,
        },
      },
      { new: true }
    );
    return res.status(200).json(updatedBlogPost); // Add .toObject() to return the plain JavaScript object
  } catch (error) {
    // console.error(error); // Log the error for debugging purposes
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete Blog Post
const deleteBlog = async (req, res) => {
  const { blogPostId } = req.params;
  try {
    const blogPost = await BlogPost.findById(blogPostId);
    if (!blogPost) {
      return res.status(404).json({
        error: 'Blog post not found.',
      });
    }
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.userType !== 'admin') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    // Delete the blog post
    await BlogPost.findByIdAndDelete(blogPostId);
    // Return the response object
    return res.status(200).json({
      message: 'Blog post deleted successfully.',
    });
  } catch (error) {
    // console.error(error); // Log the error for debugging purposes
    return res.status(500).json({ error: 'Server error' });
  }
};

const getBlogById = async (req, res) => {
  const { id } = req.params;
  try {
    // Find the blog post by ID
    const blogPost = await BlogPost.findById(id);
    if (!blogPost) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    // Find the user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Return the blog post
    return res.status(200).json(blogPost);
  } catch (error) {
    // console.error(error); // Log the error for debugging purposes
    return res.status(500).json({ error: 'Server error' });
  }
};

const getAllBlogs = async (req, res) => {
  try {
    const allBlogs = await BlogPost.find();
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    return res.status(200).json(allBlogs);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  createBlog,
  updateBlog,
  deleteBlog,
  getAllBlogs,
  getBlogById,
};
