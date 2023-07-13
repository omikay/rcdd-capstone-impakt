const express = require('express');

const router = express.Router();
const eventController = require('../controllers/eventController');

// Show all events route
router.get('/events', eventController.getAllEvents);

module.exports = router;
