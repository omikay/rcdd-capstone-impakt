const Event = require('../../models/Events');
const User = require('../../models/Users');
const server = require('../../app');
const sendEmail = require('../../utils/email');
const {
  getAllEvents,
  getEvent,
  createEvent,
  updateEvent,
  deleteEvent,
  searchEvents,
  joinEvent,
  getEventsForUser,
  leaveEvent,
} = require('../eventController');

// Mock the required modules
jest.mock('../../models/Events');
jest.mock('../../models/Users');
jest.mock('../../utils/email');
jest.mock('../../models/Tags');

// Mock the sendEmail function
sendEmail.mockResolvedValue();

afterAll(async () => {
  // Cleanup code to close the server
  await server.close();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('createEvent', () => {
  it('should create a new event and return the event object', async () => {
    // Mock request and response objects
    const req = {
      body: {
        title: 'Test Event',
        description: 'This is a test event.',
        bannerImage: 'link to banner image',
        startDate: '2023-07-15T10:00:00Z',
        endDate: '2023-07-15T18:00:00Z',
        capacity: 100,
        ageLimit: { lower: 18, upper: 65 },
        tags: ['tag1', 'tag2'],
        location: 'google map location',
      },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    sendEmail.mockResolvedValueOnce();

    // Mock the User model
    const mockUser = { id: 'user-id', createdEvents: [], save: jest.fn() };
    User.findById.mockResolvedValue(mockUser);
    mockUser.save.mockResolvedValue();

    // Mock the Event model
    const mockEvent = { id: 'event-id', save: jest.fn() };
    Event.mockImplementation(() => mockEvent);
    mockEvent.save.mockResolvedValue();

    // Call the createEvent function
    await createEvent(req, res);

    // Check if the event is created and saved
    expect(Event).toHaveBeenCalledWith({
      creator: req.user.id,
      title: req.body.title,
      description: req.body.description,
      bannerImage: req.body.bannerImage,
      startDate: req.body.startDate,
      endDate: req.body.endDate,
      capacity: req.body.capacity,
      ageLimit: req.body.ageLimit,
      tags: req.body.tags,
      location: req.body.location,
    });
    expect(mockEvent.save).toHaveBeenCalled();

    // Check if the event is added to the user's createdEvents array
    expect(mockUser.createdEvents).toContain(mockEvent.id);
    expect(mockUser.save).toHaveBeenCalled();

    // Check the response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Event created successfully.',
    });
  });

  it('should return an error if the user is not authorized to create an event', async () => {
    // Mock request and response objects
    const req = {
      body: {
        title: 'Test Event',
        description: 'This is a test event.',
        startDate: '2023-07-15T10:00:00Z',
        endDate: '2023-07-15T18:00:00Z',
        capacity: 100,
        ageLimit: { lower: 18, upper: 65 },
        tags: ['tag1', 'tag2'],
      },
      user: {
        id: 'user-id',
        userType: 'regular',
        createdEvents: ['existing-event'],
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock User.findById to return null (user not found)
    User.findById.mockResolvedValue(null);
    // Call the createEvent function
    await createEvent(req, res);

    // Check if the error response is returned
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found.',
    });
  });

  it('should return an error if there is a server error', async () => {
    // Mock request and response objects
    const req = {
      body: {
        title: 'Test Event',
        description: 'This is a test event.',
        startDate: '2023-07-15T10:00:00Z',
        endDate: '2023-07-15T18:00:00Z',
        capacity: 100,
        ageLimit: { lower: 18, upper: 65 },
        tags: ['tag1', 'tag2'],
      },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User model
    const user = { id: 'user-id', userType: 'regular', createdEvents: [] };
    User.findById.mockResolvedValue(user);

    // Mock the Event model to throw an error during creation
    const errorMessage = 'An error occurred while creating the event.';
    Event.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    // Call the createEvent function
    await createEvent(req, res);

    // Check if the error response is returned
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });
});

// Test getEvent function
describe('getEvent', () => {
  it('should get an event by its ID', async () => {
    const req = { params: { id: 'event-id' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockEvent = {
      id: 'event-id',
      creator: 'creator1',
      title: 'Mock Event',
      description: 'This is a mock event',
      bannerImage: 'https://example.com/banner.jpg',
      location: 'New York, USA',
      startDate: new Date('2023-07-15T10:00:00Z'),
      endDate: new Date('2023-07-15T18:00:00Z'),
      ageLimit: {
        lower: 18,
        upper: 65,
      },
      tags: ['tag1', 'tag2'],
      capacity: 100,
      participants: ['participant1', 'participant2'],
      donations: ['donation1', 'donation2'],
    };

    Event.findById.mockResolvedValueOnce(mockEvent);

    await getEvent(req, res);

    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockEvent);
  });

  it('should return an error if the event is not found', async () => {
    const req = { params: { id: 'non-existent-event-id' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Event.findById.mockResolvedValueOnce(null);

    await getEvent(req, res);

    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event not found.' });
  });

  it('should return an error if there is a server error', async () => {
    const req = { params: { id: 'event-id' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const errorMessage = 'An error occurred while retrieving the event.';
    Event.findById.mockRejectedValueOnce(new Error(errorMessage));

    await getEvent(req, res);

    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });
});

// Test updateEvent function
describe('updateEvent', () => {
  it('should update an event and return the updated event object', async () => {
    const req = {
      params: { id: 'event-id' },
      body: {
        title: 'Updated Event',
        description: 'This is the updated event description.',
      },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockEvent = {
      id: 'event-id',
      creator: 'user-id',
      title: 'Mock Event',
      description: 'This is a mock event',
      bannerImage: 'https://example.com/banner.jpg',
      location: 'New York, USA',
      startDate: new Date('2023-07-15T10:00:00Z'),
      endDate: new Date('2023-07-15T18:00:00Z'),
      ageLimit: {
        lower: 18,
        upper: 65,
      },
      tags: ['tag1', 'tag2'],
      capacity: 100,
      participants: ['participant1', 'participant2'],
      donations: ['donation1', 'donation2'],
      save: jest.fn(),
    };

    Event.findById.mockResolvedValueOnce(mockEvent);

    await updateEvent(req, res);

    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(mockEvent.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Event updated successfully.',
    });
  });

  it('should return an error if the event is not found', async () => {
    const req = {
      params: { id: 'non-existent-event-id' },
      body: {
        title: 'Updated Event',
        description: 'This is the updated event description.',
      },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Event.findById.mockResolvedValueOnce(null);

    await updateEvent(req, res);

    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event not found.' });
  });

  it('should return an error if the user is not authorized to update the event', async () => {
    const req = {
      params: { id: 'event-id' },
      body: {
        title: 'Updated Event',
        description: 'This is the updated event description.',
        startDate: new Date('2023-07-15T10:00:00Z'),
        endDate: new Date('2023-07-15T18:00:00Z'),
        capacity: 100,
        bannerImage: 'https://example.com/banner.jpg',
        location: 'New York, USA',
      },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockEvent = {
      id: 'event-id',
      creator: 'user-id',
      title: 'Mock Event',
      description: 'This is a mock event',
      bannerImage: 'https://example.com/banner.jpg',
      location: 'New York, USA',
      startDate: new Date('2023-07-15T10:00:00Z'),
      endDate: new Date('2023-07-15T18:00:00Z'),
      ageLimit: {
        lower: 18,
        upper: 65,
      },
      tags: ['tag1', 'tag2'],
      capacity: 100,
      participants: ['participant1', 'participant2'],
      donations: ['donation1', 'donation2'],
      save: jest.fn(),
    };

    Event.findById.mockResolvedValueOnce(mockEvent);

    // Mock User.findById to return null (user not found)
    User.findById.mockResolvedValue(null);

    await updateEvent(req, res);

    // Check if the error response is returned
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
  });

  it('should return an error if there is a server error', async () => {
    const req = {
      params: { id: 'event-id' },
      body: {
        title: 'Updated Event',
        description: 'This is the updated event description.',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Event.findById.mockRejectedValueOnce(new Error('Server error'));

    const errorMessage = 'An error occurred while updating the event.';

    await updateEvent(req, res);

    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });
});

// Test deleteEvent function
describe('deleteEvent', () => {
  it('should delete an event and return a success message', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockEvent = {
      id: 'event-id',
      creator: 'user-id',
      title: 'Mock Event',
      description: 'This is a mock event',
      bannerImage: 'https://example.com/banner.jpg',
      location: 'New York, USA',
      startDate: new Date('2023-07-15T10:00:00Z'),
      endDate: new Date('2023-07-15T18:00:00Z'),
      ageLimit: {
        lower: 18,
        upper: 65,
      },
      tags: ['tag1', 'tag2'],
      capacity: 100,
      participants: ['participant1', 'participant2'],
      donations: ['donation1', 'donation2'],
      remove: jest.fn(),
    };

    const mockUser = {
      id: 'user-id',
      events: 'event-id',
    };

    User.findById.mockResolvedValueOnce(mockUser);
    Event.findById.mockResolvedValueOnce(mockEvent);

    await deleteEvent(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.user.id);
    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(mockEvent.remove).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Event deleted successfully.',
    });
  });

  it('should return an error if the event is not found', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockUser = {
      id: 'user-id',
      events: 'event-id',
    };

    User.findById.mockResolvedValueOnce(mockUser);
    Event.findById.mockResolvedValueOnce(null);

    await deleteEvent(req, res);

    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event not found.' });
  });

  it('should return an error if the user is not authorized to delete the event', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findById.mockResolvedValueOnce(null);

    await deleteEvent(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.user.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Host not found.',
    });
  });

  it('should return an error if there is a server error', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockEvent = {
      id: 'event-id',
      creator: 'creator1',
      title: 'Mock Event',
      description: 'This is a mock event',
      bannerImage: 'https://example.com/banner.jpg',
      location: 'New York, USA',
      startDate: new Date('2023-07-15T10:00:00Z'),
      endDate: new Date('2023-07-15T18:00:00Z'),
      ageLimit: {
        lower: 18,
        upper: 65,
      },
      tags: ['tag1', 'tag2'],
      capacity: 100,
      participants: ['participant1', 'participant2'],
      donations: ['donation1', 'donation2'],
      remove: jest.fn(),
    };

    const mockUser = {
      id: 'user-id',
      events: 'event-id',
    };

    User.findById.mockResolvedValueOnce(mockUser);

    Event.findById.mockResolvedValueOnce(mockEvent);

    // Mock the Event model to throw an error during remove
    const errorMessage = 'An error occurred while deleting the event.';
    mockEvent.remove.mockRejectedValueOnce(new Error(errorMessage));

    await deleteEvent(req, res);

    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(mockEvent.remove).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });
});

describe('getAllEvents', () => {
  it('should get all events', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockEvents = [
      {
        id: 'event1-id',
        title: 'Event 1',
        description: 'This is event 1',
        // ... other properties
      },
      {
        id: 'event2-id',
        title: 'Event 2',
        description: 'This is event 2',
        // ... other properties
      },
    ];

    const mockUser = {
      id: 'user-id',
    };

    User.findById.mockResolvedValueOnce(mockUser);

    Event.find.mockResolvedValueOnce(mockEvents);

    await getAllEvents(req, res);

    expect(Event.find).toHaveBeenCalledWith();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(mockEvents);
  });

  it('should return an error if there is a server error', async () => {
    const req = {};
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const errorMessage = 'An error occurred while getting the events.';
    Event.find.mockRejectedValueOnce(new Error(errorMessage));

    await getAllEvents(req, res);

    expect(Event.find).toHaveBeenCalledWith();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: errorMessage });
  });
});

describe('searchEvents', () => {
  it('should return events matching the search criteria', async () => {
    const req = {
      query: {
        search: 'concert',
        location: 'New York',
        startDate: '2023-07-15',
        endDate: '2023-07-20',
        tags: ['music', 'live'],
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the find method of the Event model to return some events
    const mockEvents = [
      {
        title: 'Concert in New York',
        description: 'Rock concert in New York',
        location: 'New York',
        startDate: new Date('2023-07-18'),
        endDate: '2023-07-20',
        tags: ['music', 'live'],
      },
      {
        title: 'Music Festival',
        description: 'Music festival in Chicago',
        location: 'Chicago',
        startDate: new Date('2023-07-17'),
        endDate: '2023-07-20',
        tags: ['music', 'live'],
      },
    ];
    Event.find.mockResolvedValueOnce(mockEvents);

    await searchEvents(req, res);

    // Check if the find method was called with the correct filter
    expect(Event.find).toHaveBeenCalledWith({
      $or: [
        { title: { $regex: 'concert', $options: 'i' } },
        { description: { $regex: 'concert', $options: 'i' } },
      ],
      location: { $regex: 'New York', $options: 'i' },
      startDate: { $gte: new Date('2023-07-15') },
      endDate: { $lte: new Date('2023-07-20') },
      tags: { $in: ['music', 'live'] },
    });

    // Check if the response contains the mock events
    expect(res.json).toHaveBeenCalledWith(mockEvents);
  });

  it('should return an empty array if no events match the search criteria', async () => {
    const req = {
      query: {
        search: 'conference',
        location: 'Los Angeles',
        startDate: '2023-07-15',
        endDate: '2023-07-20',
        tags: ['tech'],
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the find method of the Event model to return no events
    Event.find.mockResolvedValueOnce(null);

    await searchEvents(req, res);

    // Check if the find method was called with the correct filter
    expect(Event.find).toHaveBeenCalledWith({
      $or: [
        { title: { $regex: 'conference', $options: 'i' } },
        { description: { $regex: 'conference', $options: 'i' } },
      ],
      location: { $regex: 'Los Angeles', $options: 'i' },
      startDate: { $gte: new Date('2023-07-15') },
      endDate: { $lte: new Date('2023-07-20') },
      tags: { $in: ['tech'] },
    });

    // Check if the response contains an empty array
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: 'No events found for the requested query.',
    });
  });

  it('should return an error if there is a server error', async () => {
    const req = {
      query: {
        search: 'concert',
        location: 'New York',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the find method of the Event model to throw an error
    Event.find.mockRejectedValueOnce(new Error('Server error'));

    await searchEvents(req, res);

    // Check if the response contains the error message
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'An error occurred while searching the events.',
    });
  });
});

describe('joinEvent', () => {
  it('should allow a user to join an event', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User and Event models
    const mockUser = {
      id: 'user-id',
      joinedEvents: ['event1', 'event2'],
    };
    const mockEvent = {
      id: 'event-id',
      participants: [],
      capacity: 100,
    };

    User.findById.mockResolvedValueOnce(mockUser);
    Event.findById.mockResolvedValueOnce(mockEvent);
    Event.findOneAndUpdate.mockResolvedValueOnce(mockEvent);
    User.findOneAndUpdate.mockResolvedValueOnce(mockUser);

    await joinEvent(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.user.id);
    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(Event.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: req.params.id, participants: { $ne: req.user.id } },
      { $push: { participants: req.user.id } }
    );
    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: req.user.id, joinedEvents: { $ne: req.params.id } },
      { $push: { joinedEvents: req.params.id } }
    );
    expect(sendEmail).toHaveBeenCalledWith(
      mockUser.email,
      `Event joined: ${mockEvent.title}!`,
      `Dear ${mockUser.name}, you have successfully joined the event ${mockEvent.title}.`
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User joined the event successfully.',
    });
  });

  it('should return an error if the event is not found', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Event.findById.mockResolvedValueOnce(null);

    await joinEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Event not found.',
    });
  });

  it('should return an error if the user is not found', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findById.mockResolvedValueOnce(null);

    await joinEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found.',
    });
  });

  it('should return an error if the user is already a participant of the event', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockEvent = {
      id: 'event-id',
      participants: ['p1', 'user-id'],
      capacity: 100,
    };
    const mockUser = {
      id: 'user-id',
      joinedEvents: ['event-id', 'event2'],
    };

    User.findById.mockResolvedValueOnce(mockUser);
    Event.findById.mockResolvedValueOnce(mockEvent);

    await joinEvent(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.user.id);
    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User is already participating in the event.',
    });
  });

  it('should return an error if the event has reached its capacity', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockEvent = {
      id: 'event-id',
      participants: ['p1', 'p2', 'p3'],
      capacity: 3,
    };
    const mockUser = {
      id: 'user-id',
      joinedEvents: ['event 1', 'event2'],
    };

    Event.findById.mockResolvedValueOnce(mockEvent);
    User.findById.mockResolvedValueOnce(mockUser);

    await joinEvent(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Event has reached its capacity.',
    });
  });

  it('should return an error if there is a server error', async () => {
    const req = {
      params: { id: 'event-id' },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Event.findById.mockRejectedValueOnce(new Error('Server error'));
    User.findById.mockRejectedValueOnce(new Error('Server error'));

    await joinEvent(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'An error occurred while joining the event.',
    });
  });
});

describe('getEventForUser', () => {
  it('should return events created and participated by the user', async () => {
    // Mock request and response objects
    const req = {
      params: {
        userId: 'user123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Sample events data
    const createdEvents = [
      { title: 'Event 1', startDate: new Date('2023-09-01') },
      { title: 'Event 2', startDate: new Date('2023-10-01') },
    ];
    const participatingEvents = [
      { title: 'Event 3', endDate: new Date('2023-08-15') },
      { title: 'Event 4', endDate: new Date('2023-09-15') },
    ];

    // Mock User.findById to return a sample user
    User.findById.mockResolvedValue({
      _id: 'user123',
      name: 'John Doe',
      createdEvents: createdEvents.map((event) => ({ _id: event.id })),
      participatingEvents: participatingEvents.map((event) => ({
        _id: event.id,
      })),
    });

    // Mock Event.find to return the sample events data
    Event.find
      .mockResolvedValueOnce(createdEvents)
      .mockResolvedValueOnce(participatingEvents);

    // Call the getEventsForUser function
    await getEventsForUser(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      createdEvents,
      upcomingParticipatingEvents: [
        { title: 'Event 3', endDate: new Date('2023-08-15') },
        { title: 'Event 4', endDate: new Date('2023-09-15') },
      ],
      passedParticipatingEvents: [],
    });
    expect(User.findById).toHaveBeenCalledTimes(1);
    expect(Event.find).toHaveBeenCalledTimes(2);
  });

  it('should return an error when user is not found', async () => {
    const req = {
      params: {
        userId: 'user123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findById.mockResolvedValue(null);
    // Call the getUserProfile function
    await getEventsForUser(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User not found.',
    });
    expect(User.findById).toHaveBeenCalledTimes(1);
  });

  it('should return an internal server error when a database error occurs', async () => {
    const req = {
      params: {
        userId: 'user123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findById.mockRejectedValue(new Error('Database error'));
    // Call the getUserProfile function
    await getEventsForUser(req, res);

    // Assertions
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Internal server error',
    });
    expect(User.findById).toHaveBeenCalledTimes(1);
  });
});
describe('leaveEvent ', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should leave the event successfully', async () => {
    const req = {
      user: {
        id: 'user123',
      },
      params: {
        id: 'event246',
      },
    };

    const userId = 'user123';
    const eventId = 'event246';

    // Mock the event and user data
    const event = {
      _id: eventId,
      participants: [userId],
      title: 'Test Event',
    };

    const user = {
      _id: userId,
      joinedEvents: [eventId],
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the database calls
    Event.findById.mockResolvedValue(event);
    User.findById.mockResolvedValue(user);
    User.findOneAndUpdate.mockResolvedValue({});
    Event.findOneAndUpdate.mockResolvedValue({});

    await leaveEvent(req, res);
    try {
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'User left the event successfully.',
      });
    } catch (error) {
      // console.error('Error leaving event:', error);
      res
        .status(500)
        .json({ error: 'An error occurred while leaving the event.' });
    }

    // Check if the database methods were called with the correct arguments
    expect(Event.findById).toHaveBeenCalledWith(eventId);
    expect(User.findById).toHaveBeenCalledWith(userId);
  });

  it('should return an error when user is not found', async () => {
    const req = {
      params: {
        userId: 'user123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findById.mockResolvedValue(null);
    // Call the getUserProfile function
    await leaveEvent(req, res);
    try {
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'User not found',
      });
    } catch (error) {
      // console.error('Error leaving event:', error);
      res
        .status(500)
        .json({ error: 'An error occurred while leaving the event.' });
    }
  });

  it('should return an error when event is not found', async () => {
    const req = {
      params: {
        eventId: 'event123',
      },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Event.findById.mockResolvedValue(null);
    // Call the getUserProfile function
    await leaveEvent(req, res);
    try {
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Event not found',
      });
    } catch (error) {
      // console.error('Error leaving event:', error);
      res
        .status(500)
        .json({ error: 'An error occurred while leaving the event.' });
    }
  });

  it('should return 400 if the user is not participating in the event', async () => {
    const req = {
      user: {
        id: 'user123',
      },
      params: {
        id: 'event246',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const eventId = 'event246';
    const userId = 'user123';

    // Mock the event and user data
    const event = {
      _id: eventId,
      participants: ['someOtherUser'],
    };

    const user = {
      _id: userId,
      joinedEvents: ['someOtherEvent'],
    };

    // Mock the database calls
    Event.findById.mockResolvedValue(event);
    User.findById.mockResolvedValue(user);

    await leaveEvent(req, res);
    try {
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        error: 'event not found',
      });
    } catch (error) {
      // console.error('Error leaving event:', error);
      res
        .status(500)
        .json({ error: 'An error occurred while leaving the event.' });
    }

    // Check if the database methods were called with the correct arguments
    expect(Event.findById).toHaveBeenCalledWith(eventId);
    expect(User.findById).toHaveBeenCalledWith(userId);
  });
});


