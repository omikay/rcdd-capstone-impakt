const request = require('supertest');
const app = require('../../app');
const Event = require('../../models/Events');
const User = require('../../models/Users');
const sendEmail = require('../../utils/email');
const { updateEvent, joinEvent } = require('../eventController');

jest.mock('../../models/Events');
jest.mock('../../models/Users');
jest.mock('../../utils/email');

// Create a mock event object
const mockEvent = {
  _id: 'event123',
  title: 'Sample Event',
  description: 'This is a sample event.',
  startDate: '2023-07-18',
  endDate: '2023-07-19',
  capacity: 50,
  location: 'Sample Location',
  banner: 'https://example.com/banner.jpg',
  minAge: 18,
  maxAge: 60,
  tags: ['tag1', 'tag2'],
  participants: ['user123'],
  save: jest.fn(),
};

// Create a mock user object
const mockUser = {
  _id: 'user123',
  name: 'John Doe',
  email: 'john.doe@example.com',
  events: ['event123'],
  save: jest.fn(),
};

// Create a mock middleware to authenticate the user
const mockAuth = (req, res, next) => {
  req.user = { id: 'user123' };
  next();
};

// Endpoint to test updating an event
app.put('/events/:eventId', mockAuth, async (req, res) => {
  await updateEvent(req, res);
});

// Endpoint to test joining an event
app.post('/events/:eventId/join', mockAuth, async (req, res) => {
  await joinEvent(req, res);
});

describe('updateEvent', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      params: { id: 'event123' },
      body: {
        title: 'Updated Event',
        description: 'This is an updated event.',
        startDate: '2023-07-20',
        endDate: '2023-07-21',
        capacity: 100,
        location: 'Updated Location',
        banner: 'https://example.com/updated-banner.jpg',
        minAge: 21,
        maxAge: 80,
        tagIds: ['tag3', 'tag4'],
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update the event successfully', async () => {
    Event.findByIdAndUpdate.mockResolvedValueOnce(mockEvent);

    await updateEvent(req, res);

    expect(Event.findByIdAndUpdate).toHaveBeenCalledWith(
      'event123',
      {
        title: 'Updated Event',
        description: 'This is an updated event.',
        startDate: '2023-07-20',
        endDate: '2023-07-21',
        capacity: 100,
        location: 'Updated Location',
        banner: 'https://example.com/updated-banner.jpg',
        minAge: 21,
        maxAge: 80,
        tags: ['tag3', 'tag4'],
      },
      { new: true }
    );
    expect(mockEvent.save).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({
      message: 'Event updated successfully.',
      event: mockEvent,
    });
  });

  it('should return an error if the event does not exist', async () => {
    Event.findByIdAndUpdate.mockResolvedValueOnce(null);

    await updateEvent(req, res);

    expect(Event.findByIdAndUpdate).toHaveBeenCalledWith(
      'event123',
      expect.any(Object),
      expect.any(Object)
    );
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event not found' });
  });
});

describe('joinEvent', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { id: 'user123' },
      params: { id: 'event123' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should allow the user to join the event successfully', async () => {
    Event.findById.mockResolvedValueOnce(mockEvent);
    User.findById.mockResolvedValueOnce(mockUser);

    await joinEvent(req, res);

    expect(Event.findById).toHaveBeenCalledWith('event123');
    expect(mockEvent.participants).toContain('user123');
    expect(mockEvent.save).toHaveBeenCalled();

    expect(User.findById).toHaveBeenCalledWith('user123');
    expect(mockUser.events).toContain('event123');
    expect(mockUser.save).toHaveBeenCalled();

    expect(sendEmail).toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User joined the event successfully.',
    });
  });
});
