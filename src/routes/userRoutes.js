const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route for user signup
router.post('/signup', userController.postSignup);

// Route for Google OAuth
router.post('/auth/google', userController.postGoogleAuth);

module.exports = router;