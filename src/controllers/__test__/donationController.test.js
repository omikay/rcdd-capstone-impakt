const Donation = require('../../models/Donations');
const User = require('../../models/Users');
const Event = require('../../models/Events');
const sendEmail = require('../../utils/email');
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

describe('makeDonation, getUserDonations, getEventDonations', () => {
  test('should create a new donation and send an email notification', async () => {
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
    const donation = { id: 'donation-id', save: jest.fn() };
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
      message: 'Donation created successfully.',
      donationId: donation.id,
    });
  });

  test('should return an error if user is not found', async () => {
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

  test('should return an error if an error occurs during donation creation', async () => {
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

  test('should return an error if the event is not found', async () => {
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

  test('should get all donations for a specific event', async () => {
    const req = { params: { eventId: 'event_id' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    Event.findById.mockResolvedValue({
      donations: ['donation_1', 'donation_2'],
    });

    await getEventDonations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.statusCode).toBe(200); // Check the actual response status value
    expect(res.json).toHaveBeenCalledWith(['donation_1', 'donation_2']);
    expect(Event.findById).toHaveBeenCalledWith('event_id');
  });

  test('should get all donations for a specific user', async () => {
    const req = { params: { userId: 'user_id' } };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    User.findById.mockResolvedValue({
      donations: ['donation_1', 'donation_2'],
    });

    await getUserDonations(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(['donation_1', 'donation_2']);
    expect(User.findById).toHaveBeenCalledWith('user_id');
  });
});
