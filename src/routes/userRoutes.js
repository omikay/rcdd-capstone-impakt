const express = require('express');

const router = express.Router();
const userController = require('../controllers/userController');

// Update user profile route
router.put('/user:id/update', userController.updateUserProfile);

module.exports = router;
