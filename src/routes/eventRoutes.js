const express = require('express');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();
const {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
} = require('../controllers/eventController');

// Create an event
router.post('/events', isAuthorized, createEvent);

// Get all events
router.get('/events', isAuthorized, getAllEvents);

// Get a specific event
router.get('/events/:eventId', isAuthorized, getEvent);

// Update an event
router.put('/events/:eventId/update', isAuthorized, updateEvent);

// Delete an event
router.delete('/events/:eventId', isAuthorized, deleteEvent);

// User joins an event
router.post('/events/:eventId/join', isAuthorized, joinEvent);

module.exports = router;
