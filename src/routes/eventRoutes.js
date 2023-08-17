const express = require('express');
const isAuthorized = require('../middlewares/auth');
const {
  createEvent,
  getAllEvents,
  getEvent,
  searchEvents,
  updateEvent,
  deleteEvent,
  joinEvent,
  leaveEvent,
  getEventsForUser,
} = require('../controllers/eventController');

const router = express.Router();

// Create an event
router.post('/events', isAuthorized, createEvent);

// leave event
router.post('/events/:id/leave', isAuthorized, leaveEvent);

// get events for user
router.get('/user/:id/events', isAuthorized, getEventsForUser);

// Update an event
router.patch('/events/:id/update', isAuthorized, updateEvent);

// User joins an event
router.post('/events/:id/join', isAuthorized, joinEvent);

// Get all events
router.get('/events', getAllEvents);

// Search events
router.get('/events/search', searchEvents);

// Get a specific event
router.get('/events/:id', getEvent);

// Delete an event
router.delete('/events/:id', isAuthorized, deleteEvent);

module.exports = router;
