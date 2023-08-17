const express = require('express');
const {
  makeDonation,
  getUserDonations,
  getEventDonations,
} = require('../controllers/donationController');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();

// Make a new donation
router.post('/donate', makeDonation);

// Get donations by user
router.get('/user/:id/donations', getUserDonations);

// Get donations by event
router.get('/events/:id/donations', getEventDonations);

module.exports = router;
