const Donation = require('../../models/Donations');
const User = require('../../models/Users');
const Event = require('../../models/Events');
const sendEmail = require('../../utils/email');
const server = require('../../app');
const {
  makeDonation,
  getUserDonations,
  getEventDonations,
} = require('../donationController');

// Mock the required modules
jest.mock('../../models/Donations');
jest.mock('../../models/Users');
jest.mock('../../models/Events');
jest.mock('../../utils/email');

afterAll(async () => {
  // Cleanup code to close the server
  await server.close();
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('makeDonation', () => {
  it('should create a new donation and send an email notification', async () => {
    // Mock request and response objects
    const req = {
      body: { eventId: 'event-id', amount: 100 },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User and Event models
    const user = { email: 'user@example.com', donations: [], save: jest.fn() };
    const event = { title: 'Test Event', donations: [], save: jest.fn() };
    User.findById.mockResolvedValue(user);
    Event.findById.mockResolvedValue(event);

    // Mock the Donation model
    const donation = { donationId: 'donation-id', save: jest.fn() };
    Donation.mockImplementation(() => donation);
    donation.save.mockResolvedValue();
    user.save.mockResolvedValue();
    event.save.mockResolvedValue();

    // Call the makeDonation function
    await makeDonation(req, res);

    // Check if the donation is created and saved
    expect(Donation).toHaveBeenCalledWith({
      donor: req.user.id,
      event: req.body.eventId,
      amount: req.body.amount,
    });
    expect(donation.save).toHaveBeenCalled();

    // Check if the donation is added to the user's donations array
    expect(user.donations).toContain(donation);
    expect(user.save).toHaveBeenCalled();

    // Check if the donation is added to the event's donations array
    expect(event.donations).toContain(donation);
    expect(event.save).toHaveBeenCalled();

    // Check if the notification email is sent
    expect(sendEmail).toHaveBeenCalledWith(
      user.email,
      'Donation Successful',
      `Thank you for your generous donation of $${req.body.amount} to the event "${event.title}".`
    );

    // Check the response
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Donation made successfully.',
    });
  });

  it('should return an error if user not found', async () => {
    // Mock request and response objects
    const req = {
      body: { eventId: 'event-id', amount: 100 },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock User.findById to return null (user not found)
    User.findById.mockResolvedValue(null);

    // Call the makeDonation function
    await makeDonation(req, res);

    // Check if the error response is returned
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found.' });
  });

  it('should return an error if error occured during making donation', async () => {
    // Mock request and response objects
    const req = {
      body: { eventId: 'event-id', amount: 100 },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User model
    const user = { email: 'user@example.com', donations: [] };
    User.findById.mockResolvedValue(user);

    // Mock the Event model
    const event = { title: 'Test Event', donations: [] };
    Event.findById.mockResolvedValue(event);

    // Mock the Donation model to throw an error during creation
    const errorMessage = 'An error occurred while creating the donation.';
    Donation.mockImplementation(() => {
      throw new Error(errorMessage);
    });

    // Call the makeDonation function
    await makeDonation(req, res);

    // Check if the error response is returned
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'An error occurred while creating the donation.',
    });
  });

  it('should return an error if the event is not found', async () => {
    // Mock request and response objects
    const req = {
      body: { eventId: 'non-existent-event-id', amount: 100 },
      user: { id: 'user-id' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User model
    const user = { email: 'user@example.com', donations: [] };
    User.findById.mockResolvedValue(user);

    // Mock the Event model to return null (event not found)
    Event.findById.mockResolvedValue(null);

    // Call the makeDonation function
    await makeDonation(req, res);

    // Check if the error response is returned
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Event not found.' });
  });
});

// Test getUserDonations function
describe('getUserDonations', () => {
  it('should get all donations for a specific user', async () => {
    const req = { params: { id: 'mockUserId' } };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the User and Event models
    const mockUser = {
      id: 'mockUserId',
      googleId: 'googleId123',
      name: 'John Doe',
      email: 'johndoe@example.com',
      password: 'hashedPassword',
      dob: new Date('1990-01-01'),
      phone: '1234567890',
      location: {
        provinceState: 'California',
        country: 'USA',
      },
      profilePicture: 'https://example.com/profile.jpg',
      interests: ['tag1', 'tag2'],
      events: ['event1', 'event2'],
      userType: 'regular',
      createdEvents: ['event3', 'event4'],
      blogPosts: ['post1', 'post2'],
      donations: ['donation1', 'donation2'],
    };

    User.findById.mockResolvedValueOnce(mockUser);

    await getUserDonations(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockUser.donations);
  });
});

// Test getEventDonations function
describe('getEventDonations', () => {
  it('should get all donations for a specific event', async () => {
    const req = { params: { eventId: 'event_id' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const mockEvent = {
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

    await getEventDonations(req, res);

    expect(Event.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockEvent.donations);
  });
});
