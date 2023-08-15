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

// User account activation
router.get('/verify-account/:token', activateUser);

// User signup
router.post('/api/signup', signup);

router.get('/api/login', (req, res) => {
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
  res.render('user-profile', { user: req.user });
});

// Forgot Password - Render the "Forgot Password" form
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

// Forgot Password - Submit the "Forgot Password" form
router.post('/forgot-password', forgotPassword);

// Password Reset - Render the "Password Reset" form
router.get('/reset-password/:token', (req, res) => {
  const { token } = req.params;
  res.render('reset-password', { token });
});

// Password Reset - Submit the "Password Reset" form
router.post('/reset-password/:token', resetPassword);

// User profile
router.get('/user/:id', isAuthorized, getUserProfile);

// Update user profile
router.patch('/user/updateProfile/:id', updateUserProfile);

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
