const express = require('express');
const passport = require('../utils/googleOAuth');
const {
  signup,
  activateUser,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
  connectGoogleAccount,
  forgotPassword,
  resetPassword,
  getEventsForUser,
} = require('../controllers/userController');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();

// Homepage route
router.get('/', (req, res) => {
  // Render the 'landing.ejs' view from the views/pages directory
  res.render('pages/index');
});
// User signup - Render the signup form
router.get('/api/signup', (req, res) => {
  res.render('pages/signup');
});
// User signup
router.post('/api/signup', signup);

// User login - Render the signup form
router.get('/api/login', (req, res) => {
  res.render('pages/login');
});

// User login
router.post('/api/login', login);

// User account activation
router.get('/verify-account/:token', activateUser);

// User logout
router.get('/api/logout', isAuthorized, logout);

// Google OAuth login
router.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);
// Forgot Password - Submit the "Forgot Password" form
router.post('/forgot-password', forgotPassword);

// Password Reset - Submit the "Password Reset" form
router.post('/reset-password/:token', resetPassword);

// User profile
router.get('/user/:id', isAuthorized, getUserProfile);

// get events for user
router.get('/user/:id/events', isAuthorized, getEventsForUser);

// Update user profile
router.patch('/user/:id/updateProfile', isAuthorized, updateUserProfile);

// Google OAuth callback
router.get(
  '/api/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect(`/user/profile`);
  }
);

// Connect Google account
router.patch('/api/auth/connectGoogle', isAuthorized, connectGoogleAccount);

module.exports = router;
