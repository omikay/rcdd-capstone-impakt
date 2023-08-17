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
router.post('/user/:id/donate', makeDonation);

// Get donations by user
router.get('/user/:id/donations', getUserDonations);

// Get donations by event
router.get('/events/:id/donations', getEventDonations);

module.exports = router;
