const Event = require('../models/Events');
const User = require('../models/Users');
const sendEmail = require('../utils/email');



const createEvent = async (req, res) => {
  try {
    const {
      hostId,
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      banner,
      minAge,
      maxAge,
      tagIds,
    } = req.body;

    const event = new Event({
      hostId,
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      banner,
      minAge,
      maxAge,
      tags: tagIds,
    });

    await event.save();

    const message = `Event created successfully: ${event.title}`;
    await sendEmail(event.hostId.email, 'Event Created', message);

    return res
      .status(201)
      .json({ message: 'Event created successfully.', event });
  } catch (error) {
    console.error('Error creating event:', error);
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate('tags', 'tag_name');
    return res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
  }
};

const getEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate('tags', 'tag_name');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json(event);
  } catch (error) {
    console.error('Error getting event:', error);
  }
};

const updateEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      banner,
      minAge,
      maxAge,
      tagIds,
    } = req.body;

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        title,
        description,
        startDate,
        endDate,
        capacity,
        location,
        banner,
        minAge,
        maxAge,
        tags: tagIds,
      },
      { new: true }
    ).populate('tags', 'tag_name');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const message = `Event updated: ${event.title}`;
    await sendEmail(event.hostId.email, 'Event Updated', message);

    return res.json({ message: 'Event updated successfully.', event });
  } catch (error) {
    console.error('Error updating event:', error);
  }
};

const deleteEvent = async (req, res) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByIdAndDelete(eventId).populate(
      'tags',
      'tag_name'
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const message = `Event deleted: ${event.title}`;
    await sendEmail(event.hostId.email, 'Event Deleted', message);

    return res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error);
  }
// Update an event
const updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const { title, description, bannerImage } = req.body;

  try {
    // Find the event in the database
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Update the event with the provided data
    event.title = title;
    event.description = description;
    event.bannerImage = bannerImage;
    await event.save();

    // Send notification emails to current participants and the event creator
    const participants = event.participants;
    const creatorId = event.creator;

    const recipients = [...participants, creatorId];
    const eventUrl = `//localhost:${process.env.NODE_LOCAL_PORT}/events/${eventId}`;

    for (const recipientId of recipients) {
      const recipient = await User.findById(recipientId);
      const recipientEmail = recipient.email;

      await sendEmail(
        recipientEmail,
        `Event Updated: ${event.title}`,
        `The event "${event.title}" has been updated. You can view the event details [here](${eventUrl}).`
      );
    }

    return res.status(200).json({ message: 'Event updated successfully.' });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'An error occurred while updating the event.' });
  }
};

// User joins an event
const joinEvent = async (req, res) => {
  const { eventId } = req.params;
  const userId = req.user.id;

  try {
    // Find the event in the database
    const event = await Event.findById(eventId);

    if (!event) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    // Check if the user is already participating in the event
    if (event.participants.includes(userId)) {
      return res.status(400).json({ error: 'User is already participating in the event.' });
    }

    // Check if the event has reached its capacity
    if (event.participants.length >= event.capacity) {
      return res.status(400).json({ error: 'Event has reached its capacity.' });
    }

    // Add the user to the event's participants array
    event.participants.push(userId);
    await event.save();

    // Add the event to the user's events array
    const user = await User.findById(userId);
    user.events.push(eventId);
    await user.save();

    await sendEmail(
      user.email,
      `Event joined: ${event.title}!`,
      `Dear ${user.name}, you have successfully joined the event ${event.title}.`
    );

    return res.status(200).json({ message: 'User joined the event successfully.' });
  } catch (error) {
    console.error('Error joining event:', error);
    return res.status(500).json({ error: 'An error occurred while joining the event.' });
  }
};

module.exports = { updateEvent, joinEvent,  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent }
const sendEmail = require('../utils/email');

const createEvent = async (req, res, next) => {
  try {
    const {
      hostId,
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      banner,
      minAge,
      maxAge,
      tagIds,
    } = req.body;

    const event = new Event({
      hostId,
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      banner,
      minAge,
      maxAge,
      tags: tagIds,
    });

    await event.save();

    const message = `Event created successfully: ${event.title}`;
    await sendEmail(event.hostId.email, 'Event Created', message);

    return res
      .status(201)
      .json({ message: 'Event created successfully.', event });
  } catch (error) {
    console.error('Error creating event:', error);
    return next(error);
  }
};

const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find().populate('tags', 'tag_name');
    return res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    return next(error);
  }
};

const getEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findById(eventId).populate('tags', 'tag_name');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json(event);
  } catch (error) {
    console.error('Error getting event:', error);
    return next(error);
  }
};

const updateEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const {
      title,
      description,
      startDate,
      endDate,
      capacity,
      location,
      banner,
      minAge,
      maxAge,
      tagIds,
    } = req.body;

    const event = await Event.findByIdAndUpdate(
      eventId,
      {
        title,
        description,
        startDate,
        endDate,
        capacity,
        location,
        banner,
        minAge,
        maxAge,
        tags: tagIds,
      },
      { new: true }
    ).populate('tags', 'tag_name');

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const message = `Event updated: ${event.title}`;
    await sendEmail(event.hostId.email, 'Event Updated', message);

    return res.json({ message: 'Event updated successfully.', event });
  } catch (error) {
    console.error('Error updating event:', error);
    return next(error);
  }
};

const deleteEvent = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const event = await Event.findByIdAndDelete(eventId).populate(
      'tags',
      'tag_name'
    );

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const message = `Event deleted: ${event.title}`;
    await sendEmail(event.hostId.email, 'Event Deleted', message);

    return res.json({ message: 'Event deleted successfully.' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return next(error);
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent,
};
