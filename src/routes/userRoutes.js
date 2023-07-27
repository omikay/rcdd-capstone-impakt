const express = require('express');
const passport = require('../utils/googleOAuth');
const {
  signup,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
  connectGoogleAccount,
  forgotPassword,
  resetPassword,
} = require('../controllers/userController');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();

// Homepage route
router.get('/', (req, res) => {
  // Render the 'landing.ejs' view from the views/pages directory
  res.render('pages/landing');
});

// User signup - Render the signup form
router.get('/signup', (req, res) => {
  res.render('pages/signup');
});

// User signup
router.post('/api/signup', signup);

router.get('/login', (req, res) => {
  res.render('pages/login');
});

// User login
router.post('/api/login', login);

// User logout
router.get('/api/logout', logout);

// Google OAuth login
router.get(
  '/api/auth/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

router.get('/profile', isAuthorized, (req, res) => {
  res.render('pages/user-profile', { user: req.user });
});

// Forgot Password - Render the "Forgot Password" form
router.get('/forgot-password', (req, res) => {
  res.render('pages/forgot-password');
});

// Forgot Password - Submit the "Forgot Password" form
router.post('/forgot-password', forgotPassword);

// Password Reset - Render the "Password Reset" form
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  res.render('pages/reset-password', { token });
});

// Password Reset - Submit the "Password Reset" form
router.post('/reset-password/:token', resetPassword);

// Update user profile
router.patch('/user/updateProfile', isAuthorized, updateUserProfile);

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
