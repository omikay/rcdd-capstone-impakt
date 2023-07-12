const Event = require('../models/Events');
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
    return res.status(500).json({ error: 'Internal server error' });
  }
};

const getAllEvents = async (req, res, next) => {
  try {
    const events = await Event.find().populate('tags', 'tag_name');
    return res.json(events);
  } catch (error) {
    console.error('Error getting events:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
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
    return res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createEvent,
  getAllEvents,
  getEvent,
  updateEvent,
  deleteEvent,
};
