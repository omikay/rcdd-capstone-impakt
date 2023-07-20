const Event = require('../models/Events');
const User = require('../models/Users');
const sendEmail = require('../utils/email');

// Create an event
const createEvent = async (req, res) => {
  try {
    const {
      creator,
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      bannerImage,
      ageLimit,
      participants,
      tags,
      donations,
    } = req.body;

    const event = new Event({
      creator,
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      bannerImage,
      ageLimit,
      participants,
      tags,
      donations,
    });

    await event.save();

    const message = `Event created successfully: ${event.title}`;
    await sendEmail(event.hostId.email, 'Event Created', message);

    return res
      .status(201)
      .json({ message: 'Event created successfully.', event });
  } catch (error) {
    // console.error('Error creating event:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while creating the event.' });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();

    return res.json(events);
  } catch (error) {
    // console.error('Error getting events:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while getting the events.' });
  }
};

const searchEvents = async (req, res) => {
  try {
    const { search, location, startDate, endDate, tags } = req.query;

    const filter = {};

    if (search) {
      // Use a regular expression to perform a case-insensitive search on the event title or description
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (location) {
      filter.location = { $regex: location, $options: 'i' };
    }

    if (startDate) {
      filter.startDate = { $gte: new Date(startDate) };
    }

    if (endDate) {
      filter.endDate = { $lte: new Date(endDate) };
    }

    if (tags) {
      filter.tags = { $in: tags };
    }

    const events = await Event.find(filter);

    return res.json(events);
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'An error occurred while searching the events.' });
  }
};

const getEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json(event);
  } catch (error) {
    // console.error('Error getting event:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while getting the event.' });
  }
};

const updateEvent = async (req, res) => {
  try {
    const eventId = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      bannerImage,
    } = req.body;

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.participants.length > capacity) {
      return res.status(406).json({
        error:
          'Event already has more registered volunteers than the requested capacity.',
      });
    }

    // Update the event fields
    event.title = title;
    event.description = description;
    event.startDate = startDate;
    event.endDate = endDate;
    event.capacity = capacity;
    event.location = location;
    event.bannerImage = bannerImage;

    await event.save();

    const message = `Event updated successfully: ${event.title}`;
    await sendEmail(event.creator.email, 'Event Updated', message);

    return res.json({ message: 'Event updated successfully.', event });
  } catch (error) {
    // console.error('Error updating event:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while updating the event.' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByIdAndDelete(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const message = `Event deleted successfully: ${event.title}`;
    await sendEmail(event.hostId.email, 'Event Deleted', message);

    return res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    // console.error('Error deleting event:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while deleting the event.' });
  }
};

// User joins an event
const joinEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (event.participants.includes(userId)) {
      return res
        .status(400)
        .json({ error: 'User is already participating in the event.' });
    }

    if (event.participants.length >= event.capacity) {
      return res.status(400).json({ error: 'Event has reached its capacity.' });
    }

    event.participants.push(userId);
    await event.save();

    const user = await User.findById(userId);
    user.events.push(eventId);
    await user.save();

    await sendEmail(
      user.email,
      `Event joined: ${event.title}!`,
      `Dear ${user.name}, you have successfully joined the event ${event.title}.`
    );

    return res
      .status(200)
      .json({ message: 'User joined the event successfully.' });
  } catch (error) {
    // console.error('Error joining event:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while joining the event.' });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  searchEvents,
  getEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
};
