const supertest = require('supertest');
const app = require('../../app');

const request = supertest(app);
const Event = require('../../models/Events');
const User = require('../../models/Users');
const Tag = require('../../models/Tags');
const {
  createEvent,
  getAllEvents,
  searchEvent,
  getEvent,
  updateEvent,
  deleteEvent,
  joinEvent,
} = require('../eventController');

jest.mock('../../models/Events');
jest.mock('../../models/Users');
jest.mock('../../models/Tags'); // Mock the Tag model

let mockEvent = {
  _id: 'event-id',
  title: 'Test Event',
  hostId: 'host-id',
  participants: [],
  capacity: 50,
  save: jest.fn(),
};

const mockUser = {
  _id: 'user-id',
  name: 'John Doe',
  email: 'john@example.com',
  events: [],
  save: jest.fn(),
};

const mockReq = {
  params: { eventId: mockEvent.id },
  user: { id: mockUser.id },
};

const mockRes = {
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
};

beforeEach(() => {
  mockEvent = {
    _id: 'event-id',
    title: 'Test Event',
    hostId: 'host-id',
    participants: [],
    capacity: 50,
    save: jest.fn(),
  };
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('joinEvent', () => {
  it('should add user to event participants and add event to user events', async () => {
    Event.findById.mockResolvedValueOnce(mockEvent);
    User.findById.mockResolvedValueOnce(mockUser);

    await joinEvent(mockReq, mockRes);

    expect(Event.findById).toHaveBeenCalledWith(mockEvent.id);
    expect(User.findById).toHaveBeenCalledWith(mockUser.id);

    expect(mockEvent.participants).toContain(mockUser.id);
    expect(mockEvent.save).toHaveBeenCalled();

    expect(mockUser.events).toContain(mockEvent.id);
    expect(mockUser.save).toHaveBeenCalled();

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User joined the event successfully.',
    });
  });

  it('should return an error if the event is not found', async () => {
    Event.findById.mockResolvedValueOnce(null);

    await joinEvent(mockReq, mockRes);

    expect(Event.findById).toHaveBeenCalledWith(mockEvent.id);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith({ error: 'Event not found.' });
  });

  it('should return an error if the user is already participating in the event', async () => {
    mockEvent.participants.push(mockUser.id);
    Event.findById.mockResolvedValueOnce(mockEvent);

    await joinEvent(mockReq, mockRes);

    expect(Event.findById).toHaveBeenCalledWith(mockEvent.id);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'User is already participating in the event.',
    });
  });

  it('should return an error if the event has reached its capacity', async () => {
    mockEvent.capacity = 0; // Set the capacity to zero to simulate a full event
    Event.findById.mockResolvedValueOnce(mockEvent);

    await joinEvent(mockReq, mockRes);

    expect(Event.findById).toHaveBeenCalledWith(mockEvent.id);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'Event has reached its capacity.',
    });
  });

  it('should handle server errors', async () => {
    Event.findById.mockRejectedValueOnce(new Error('Internal server error'));

    await joinEvent(mockReq, mockRes);

    expect(Event.findById).toHaveBeenCalledWith(mockEvent.id);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      error: 'An error occurred while joining the event.',
    });
  });
});

describe('updateEvent', () => {
  const updateEventData = {
    title: 'Updated Event',
    startDate: new Date('2023-07-30'),
    endDate: new Date('2023-07-31'),
    capacity: 100,
  };

  it('should update the event successfully', async () => {
    const response = await request
      .put(`/api/events/${mockEvent.id}`)
      .send(updateEventData)
      .set('Authorization', `Bearer ${mockUser.token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Event updated successfully.');
    expect(response.body.event).toMatchObject(updateEventData);
  });

  it('should return an error if the event is not found', async () => {
    const response = await request
      .put(`/api/events/non-existing-id`)
      .send(updateEventData)
      .set('Authorization', `Bearer ${mockUser.token}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('Event not found');
  });

  it('should handle server errors', async () => {
    const response = await request
      .put(`/api/events/${mockEvent.id}`)
      .send(updateEventData)
      .set('Authorization', `Bearer ${mockUser.token}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe(
      'An error occurred while updating the event.'
    );
  });
});

describe('searchEvents', () => {
  it('should search events with the given parameters', async () => {
    // Mock data for request query
    const req = {
      query: {
        search: 'example search',
        location: 'example location',
        startDate: '2023-07-19',
        endDate: '2023-07-21',
        tags: ['tag1', 'tag2'],
      },
    };

    // Mock data for the expected response from the Event model
    const mockEventResults = [
      { title: 'Event 1', description: 'Description 1', tags: ['tag1'] },
      { title: 'Event 2', description: 'Description 2', tags: ['tag2'] },
    ];

    // Mock the Event.find method to return the mockEventResults
    Event.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockEventResults),
    });

    // Mock the Tag.find method to return empty results (since tags are populated separately)
    Tag.find.mockResolvedValue([]);

    // Mock the Tag.populate method to return the mock tags
    const mockPopulatedTags = [
      { _id: 'tag1', tag_name: 'Tag 1' },
      { _id: 'tag2', tag_name: 'Tag 2' },
    ];
    Tag.populate.mockResolvedValue(mockPopulatedTags);

    // Mock the response object's methods
    const res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    // Call the function with the mock request and response objects
    await searchEvents(req, res);

    // Assertion: Check if Event.find was called with the correct filter
    expect(Event.find).toHaveBeenCalledWith({
      $or: [
        { title: { $regex: 'example search', $options: 'i' } },
        { description: { $regex: 'example search', $options: 'i' } },
      ],
      location: { $regex: 'example location', $options: 'i' },
      startDate: { $gte: new Date('2023-07-19') },
      endDate: { $lte: new Date('2023-07-21') },
      tags: { $in: ['tag1', 'tag2'] },
    });

    // Assertion: Check if the populate method was called with the correct arguments
    expect(Event.find().populate).toHaveBeenCalledWith('tags', 'tag_name');

    // Assertion: Check if the response.json method was called with the expected data
    expect(res.json).toHaveBeenCalledWith(mockEventResults);
  });

  it('should handle errors during search', async () => {
    // Mock request query with some invalid data
    const req = {
      query: {
        startDate: '2023-07-19', // Provide a valid date string here
      },
    };

    // Mock the Event.find method to throw an error
    Event.find.mockImplementation(() => {
      throw new Error('Database error');
    });

    // Mock the response object's methods
    const res = {
      json: jest.fn(),
      status: jest.fn(() => res),
    };

    // Call the function with the mock request and response objects
    await searchEvents(req, res);

    // Assertion: Check if Event.find was called with the correct filter
    expect(Event.find).toHaveBeenCalledWith({
      startDate: { $gte: new Date('2023-07-19') }, // Provide the valid date here
    });

    // Assertion: Check if the response status was set to 500
    expect(res.status).toHaveBeenCalledWith(500);

    // Assertion: Check if the response.json method was called with the error message
    expect(res.json).toHaveBeenCalledWith({
      error: 'An error occurred while searching the events.',
    });
  });
});
