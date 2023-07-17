const express = require('express');
const isAuthorized = require('../middlewares/auth');
const {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
} = require('../controllers/eventController');

const router = express.Router();

// Create an event
router.post('/events', isAuthorized, createEvent);

// Update an event
router.patch('/events/:eventId/update', isAuthorized, updateEvent);

// User joins an event
router.post('/events/:eventId/join', isAuthorized, joinEvent);

// Get all events
router.get('/events', isAuthorized, getAllEvents);

// Get a specific event
router.get('events/:eventId', isAuthorized, getEvent);

// Delete an event
router.delete('events/:eventId', isAuthorized, deleteEvent);

module.exports = router;
