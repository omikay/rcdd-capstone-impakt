const express = require('express');
const { createDonation, getDonationsByUser, getDonationsByEvent } = require('../controllers/donationController');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();

// Create a new donation
router.post('/api/donations', isAuthorized, createDonation);

// Get donations by user
router.get('/api/donations/user/:userId', isAuthorized, getDonationsByUser);

// Get donations by event
router.get('/api/donations/event/:eventId', isAuthorized, getDonationsByEvent);

module.exports = router;