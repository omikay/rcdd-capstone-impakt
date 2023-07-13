const Event = require('../models/Events');

// Function to get all events
const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllEvents,
};
