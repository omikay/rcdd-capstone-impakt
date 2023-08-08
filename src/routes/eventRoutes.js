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
  getEventsForUser,
  leaveEvent,
} = require('../controllers/eventController');

const router = express.Router();

// Create an event
router.post('/events/createEvent', isAuthorized, createEvent);

router.get('/events/createEvent', (req, res) => {
  const event = req.body;

  res.render('pages/createEvent', { event });
});

// leave an evant
router.post('/events/:eventId/leaveEvant', isAuthorized, leaveEvent);

// Get all eveents for an user.
router.get('/events/user/{userId}', isAuthorized, getEventsForUser);


// Update an event
router.patch('/events/:eventId/update', isAuthorized, updateEvent);

// User joins an event
router.post('/events/:eventId/join', isAuthorized, joinEvent);

// Get all events
router.get('/events', getAllEvents);

// Search events
router.get('/events/search', searchEvents);

// Get a specific event
router.get('events/:eventId', getEvent);

// Delete an event
router.delete('events/:eventId', isAuthorized, deleteEvent);

module.exports = router;
