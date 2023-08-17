const express = require('express');
const {
  makeDonation,
  getUserDonations,
  getEventDonations,
} = require('../controllers/donationController');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();

// Make a new donation
router.post('/donate', isAuthorized, makeDonation);

// Get donations by user
router.get('/user/:id/donations', isAuthorized, getUserDonations);

// Get donations by event
router.get('/events/:id/donations', isAuthorized, getEventDonations);

module.exports = router;
