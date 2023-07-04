const express = require('express');
const router = express.Router();
const { logout } = require('../controllers/userController');

router.get('/user:id/logout', logout);
