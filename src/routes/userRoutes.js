const express = require('express');
const passport = require('../utils/googleOAuth');
const { signup, login, logout, getUserProfile, updateUserProfile, connectGoogleAccount } = require('../controllers/userController');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();

// User signup
router.post('/api/signup', signup);

// User login
router.post('/api/login', login);

// User logout
router.get('/api/logout', logout);

// Google OAuth login
router.get('/api/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// User profile
router.get('/user/profile', isAuthorized, getUserProfile);

// Update user profile
router.patch('/user/updateProfile', isAuthorized, updateUserProfile);

// Google OAuth callback
router.get('/api/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
  res.redirect(`/user/profile`);
});

// Connect Google account
router.patch('/api/auth/connectGoogle', isAuthorized, connectGoogleAccount);

module.exports = router;