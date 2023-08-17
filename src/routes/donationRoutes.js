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
  res.render('makeDonation');
});

// Make a new donation
router.post('/api/donations', makeDonation);

// Get donations by user
router.get('/api/donations/:id', getUserDonations);

// Get donations by event
router.get('/api/donations/:id', getEventDonations);

module.exports = router;
