const express = require('express');
const gAuth = require('../middleware/gAuth');
const userController = require('../controllers/userController');

const router = express.Router();

// Route for user signup
router.post('/api/signup', userController.signup);

// Route for Google OAuth
router.get(
  '/api/auth/google',
  gAuth.authenticate('google', { scope: ['profile', 'email'] })
);

// // THIS HAS TO BE UPDATED (REDIRECTION ROUTES) // //
router.get(
  '/api/auth/google/callback',
  gAuth.authenticate('google', {
    failureRedirect: '/api/login',
    successRedirect: '/dashboard',
  })
);

// User login
router.post('/api/login', userController.login);

// Update user profile route
router.put('/dashboard/users/:id/update', userController.updateUserProfile);

// GET user profile route
router.get('/dashboard/users/:id/profile', userController.getUserProfile);

module.exports = router;
