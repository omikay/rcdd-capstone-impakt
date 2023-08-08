const express = require('express');
const {
  makeDonation,
  getUserDonations,
  getEventDonations,
} = require('../controllers/donationController');
const isAuthorized = require('../middlewares/auth');

const router = express.Router();

// Render the donation form
router.get('/api/donations', (req, res) => {
  const event = req.body;
  res.render('pages/donate', { event });
});

// Make a new donation
router.post('/api/donations', isAuthorized, makeDonation);

// Get donations by user
router.get('/api/donations/:userId', isAuthorized, getUserDonations);

// Get donations by event
router.get('/api/donations/:eventId', isAuthorized, getEventDonations);

module.exports = router;
