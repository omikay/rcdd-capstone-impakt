const express = require('express');
const {
  makeDonation,
  getUserDonations,
  getEventDonations,
} = require('../controllers/donationController');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();

// Make a new donation
router.post('/api/donations', isAuthorized, makeDonation);

// Get donations by user
router.get('/api/donations/user/:userId', isAuthorized, getUserDonations);

// Get donations by event
router.get('/api/donations/event/:eventId', isAuthorized, getEventDonations);

module.exports = router;
