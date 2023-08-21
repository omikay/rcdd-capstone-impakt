const Event = require('../models/Events');
const User = require('../models/Users');
const sendEmail = require('../utils/email');

// Create an event
const createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      bannerImage,
      ageLimitLower,
      ageLimitUpper,
      tags,
    } = req.body;
    // Find the the authenticated user for event creation
    const creator = await User.findById(req.user.id);

    if (!creator) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const event = new Event({
      creator: creator.id,
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      bannerImage,
      ageLimit: {
        lower: ageLimitLower,
        upper: ageLimitUpper,
      },
      tags,
    });

    await event.save();
    
    const host = await User.findById(req.user.id);

    // Add the event to the user's createdEvents array
    host.createdEvents.push(event.id);

    await host.save();

    const message = `Event created successfully: ${event.title}`;
    await sendEmail(host.email, 'Event Created', message);

    return res.status(201).json({ message: 'Event created successfully.' });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'An error occurred while creating the event.' });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find();

    // if (!events) {
    //   return res.status(404).json({ error: 'No events found.'});
    // }

    return res.status(201).json(events);
  } catch (error) {
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

    if (!events) {
      res
        .status(403)
        .json({ message: 'No events found for the requested query.' });
    }

    return res.json(events);
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'An error occurred while searching the events.' });
  }
};

const getEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    return res.status(201).json(event);
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'An error occurred while retrieving the event.' });
  }
};
const updateEvent = async (req, res) => {
  try {
    const eventId = req.params.id;

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

    // Retrieve the user from the database based on the authenticated user's ID
    const user = await User.findById(req.user.id);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    if (event.participants.length > capacity) {
      return res.status(406).json({
        error:
          'Event already has more registered volunteers than the requested capacity.',
      });
    }

    const eventHost = await User.findById(event.creator);

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
    await sendEmail(eventHost.email, 'Event Updated', message);

    // eslint-disable-next-line no-restricted-syntax
    for (const participantId of event.participants) {
      const participant = User.findById(participantId);
      sendEmail(
        participant.email,
        'Event Updated',
        `Dear ${participant.name}, please be advised some details have been updated about the event "${event.title}" by the event host.`
      );
    }

    return res.status(201).json({ message: 'Event updated successfully.' });
  } catch (error) {
    return res
      .status(500)
      .json({ error: 'An error occurred while updating the event.' });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const hostId = req.user.id;

    const eventHost = await User.findById(hostId);

    if (!eventHost) {
      return res.status(404).json({ error: 'Host not found.' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    await event.remove();

    const message = `Event deleted successfully: ${event.title}`;
    await sendEmail(eventHost.email, 'Event Deleted', message);

    // eslint-disable-next-line no-restricted-syntax
    for (const participantId of event.participants) {
      const participant = User.findById(participantId);
      sendEmail(
        participant.email,
        'Event Deleted',
        `Dear ${participant.name}, please be advised the event "${event.title}" has been deleted by the event host.`
      );
    }

    return res.status(201).json({ message: 'Event deleted successfully.' });
  } catch (error) {
    // console.error('Error deleting event:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while deleting the event.' });
  }
};
// User joins an event
const joinEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;
    // Find the user and event
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check if the user is already participating in the event
    if (event.participants.includes(userId)) {
      return res.status(400).json({
        error: 'User is already participating in the event.',
      });
    }

    // Check if the event has reached its capacity
    if (event.participants.length + 1 >= event.capacity) {
      return res.status(400).json({ error: 'Event has reached its capacity.' });
    }

    // Add the user to the participants and the event to the user's joinedEvents
    await Event.findOneAndUpdate(
      { _id: eventId, participants: { $ne: userId } }, // Ensure user is not already a participant
      { $push: { participants: userId } }
    );

    await User.findOneAndUpdate(
      { _id: userId, joinedEvents: { $ne: eventId } }, // Ensure event is not already in the user's joinedEvents
      { $push: { joinedEvents: eventId } }
    );

    // Send an email notification to the user
    await sendEmail(
      user.email,
      `Event joined: ${event.title}!`,
      `Dear ${user.name}, you have successfully joined the event ${event.title}.`
    );

    // Respond with success message
    return res.status(201).json({
      message: 'User joined the event successfully.',
    });
  } catch (error) {
    // Handle errors and respond with an error message
    return res.status(500).json({
      error: 'An error occurred while joining the event.',
    });
  }
};

const leaveEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    // Find the user and event
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check if the user is participating in the event
    if (!event.participants.includes(userId)) {
      return res.status(400).json({
        error: 'User is not participating in the event.',
      });
    }

    // Remove the user from the participants and the event from the user's joinedEvents
    await Event.findOneAndUpdate(
      { _id: eventId },
      { $pull: { participants: userId } }
    );

    await User.findOneAndUpdate(
      { _id: userId },
      { $pull: { joinedEvents: eventId } }
    );

    // Respond with success message
    return res.status(200).json({
      message: 'User left the event successfully.',
    });
  } catch (error) {
    // console.error('Error leaving event:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while leaving the event.' });
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
  leaveEvent,
};
