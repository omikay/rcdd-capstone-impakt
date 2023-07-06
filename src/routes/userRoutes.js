const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

// Update user profile route
router.put('/user:id/update', userController.updateUserProfile);

// GET user profile route
router.get('/users/:id/profile', userController.getUserProfile);



module.exports = router;
