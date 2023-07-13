const express = require('express');
const { updateEvent, joinEvent } = require('../controllers/eventController');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();

// Update an event
router.patch('/events/:eventId/update', isAuthorized, updateEvent);

// User joins an event
router.post('/events/:eventId/join', isAuthorized, joinEvent);

module.exports = router;