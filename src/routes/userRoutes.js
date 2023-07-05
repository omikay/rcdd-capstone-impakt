const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// Route for user signup
router.post('/signup', userController.postSignup);

// Route for user login
router.post('/login', userController.postLogin);

// Route for Google OAuth
router.post('/auth/google', userController.postGoogleAuth);

module.exports = router;