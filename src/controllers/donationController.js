const Donation = require('../models/Donations');
const User = require('../models/Users');
const Event = require('../models/Events');
const sendEmail = require('../utils/email');

// Make a new donation
const makeDonation = async (req, res) => {
  const { eventId, amount } = req.body;

  try {
    // Get the user ID from the authenticated user
    const userId = req.user.id;

    // Find the user in the database
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Find the event in the database
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Create a new donation instance
    const donation = new Donation({
      donor: userId,
      event: eventId,
      amount,
    });

    // Save the donation to the database
    await donation.save();

    // Add the donation to the user's donations array
    user.donations.push(donation);
    await user.save();

    // Add the donation to the event's donations array
    event.donations.push(donation);
    await event.save();

    // Send a notification email to the donor
    await sendEmail(
      user.email,
      'Donation Successful',
      `Thank you for your generous donation of $${amount} to the event "${event.title}".`
    );

    return res.status(201).json({ message: 'Donation made successfully.' });
  } catch (error) {
    // console.error('Error creating donation:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while creating the donation.' });
  }
};

// Get all donations for a specific event
const getEventDonations = async (req, res) => {
  try {
    // Find the event in the database and populate the donations
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.status(200).json(event.donations);
  } catch (error) {
    // console.error('Error retrieving event donations:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while retrieving event donations.' });
  }
};

// Get all donations for a specific user
const getUserDonations = async (req, res) => {
  try {
    // Find the user in the database and populate the donations
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json(user.donations);
  } catch (error) {
    // console.error('Error retrieving user donations:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while retrieving user donations.' });
  }
};

module.exports = { makeDonation, getEventDonations, getUserDonations };
