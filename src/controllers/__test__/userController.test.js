const request = require('supertest');
const bcrypt = require('bcrypt');
const app = require('../../app');
const User = require('../../models/Users');

const {
  connectGoogleAccount,
  logout,
  getUserProfile,
  updateUserProfile,
} = require('../userController');

// Mock the database connection
jest.mock('../../config/db');

// Mock the User model
jest.mock('../../models/Users');

// Create a mock user object
const mockUser = {
  id: '123',
  name: 'John Doe',
  location: 'New York',
  phone: '123-456-7890',
  email: 'john.doe@example.com',
  interests: ['Music', 'Movies', 'Books'],
  password: 'password',
  googleId: null,

  save: jest.fn(),
  profilePicture: 'https://example.com/image.jpg',
};

jest.mock('bcrypt');

// Create a mock token
const mockToken = 'abc';

// Create a mock middleware to authenticate the user
const mockAuth = (req, res, next) => {
  req.user = { id: mockUser.id }; // match the mock user id
  next();
};

app.post('/user/profile', mockAuth, async (req, res) => {
  await updateUserProfile(req, res, User);
});

app.get('/user/profile/:id', async (req, res) => {
  await getUserProfile(req, res, User);
});

// Test the updateUserProfile function
describe('updateUserProfile', () => {
  // Test the success case
  // Test the success case
  test('should update the user profile successfully', async () => {
    // Mock the User.findById method to return the mock user
    User.findById.mockResolvedValue(mockUser);

    // Mock the bcrypt.compare method to return false
    const compareSpy = jest.spyOn(bcrypt, 'compare');
    compareSpy.mockResolvedValue(false);

    // Mock the bcrypt.hash method to return a hashed password
    const hashSpy = jest.spyOn(bcrypt, 'hash');
    hashSpy.mockResolvedValue('hashedPassword');

    // Make a post request to update the user profile with some new data
    const response = await request(app)
      .post('/user/profile')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        name: 'Jane Doe',
        location: 'Los Angeles',
        phone: '987-654-3210',
        interests: ['Art', 'Travel', 'Sports'],
        password: 'newPassword',
        profilePicture: 'https://example.com/newImage.jpg',
      });

    // Log the user to see what it is
    console.log('User:', await User.findById(mockUser.id));

    // Expect the response status to be 200
    expect(response.status).toBe(200);

    // Expect the response message to be 'Profile updated successfully.'
    expect(response.body.message).toBe('Profile updated successfully.');

    // Expect the user fields to be updated with the new data
    expect(mockUser.name).toBe('Jane Doe');
    expect(mockUser.location).toBe('Los Angeles');
    expect(mockUser.phone).toBe('987-654-3210');
    expect(mockUser.interests).toEqual(['Art', 'Travel', 'Sports']);
    expect(mockUser.password).toBe('hashedPassword');
    expect(mockUser.profilePicture).toBe('https://example.com/newImage.jpg');

    // Restore the original implementation of the bcrypt methods
    compareSpy.mockRestore();
    hashSpy.mockRestore();
  });

  // Test the failure case when the user does not exist
  test('should return an error if the user does not exist', async () => {
    // Mock the User.findById method to return null
    User.findById.mockResolvedValue(null);

    // Make a post request to update the user profile with some new data
    const response = await request(app)
      .post('/user/profile')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        name: 'Jane Doe',
        location: 'Los Angeles',
        phone: '987-654-3210',
        interests: ['Art', 'Travel', 'Sports'],
        password: 'newPassword',
        profilePicture: 'https://example.com/newImage.jpg',
      });

    // Expect the response status to be 404
    expect(response.status).toBe(404);

    // Expect the response message to be 'User not found.'
    expect(response.body.message).toBe('User not found.');
  });

  // Test the failure case when the new password matches the previous password
  test('should return an error if the new password matches the previous password', async () => {
    // Mock the User.findById method to return the mock user
    User.findById.mockResolvedValue(mockUser);

    // Mock the bcrypt.compare method to return true
    const compareSpy = jest.spyOn(bcrypt, 'compare');
    compareSpy.mockResolvedValue(true);

    // Make a post request to update the user profile with some new data
    const response = await request(app)
      .post('/user/profile')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        name: 'Jane Doe',
        location: 'Los Angeles',
        phone: '987-654-3210',
        interests: ['Art', 'Travel', 'Sports'],
        password: 'password',
        profilePicture: 'https://example.com/newImage.jpg',
      });

    // Log the user to see what it is
    console.log('User:', await User.findById(mockUser.id));

    // Expect the response status to be 400
    expect(response.status).toBe(400);

    // Expect the response message to be 'New password cannot be the same as the previous password.'
    expect(response.body.message).toBe(
      'New password cannot be the same as the previous password.'
    );

    // Restore the original implementation of the bcrypt method
    compareSpy.mockRestore();
  });

  // Test the failure case when there is a server error
  test('should return an error if there is a server error', async () => {
    // Mock the User.findById method to throw an error
    User.findById.mockRejectedValue(new Error('Server error'));

    // Make a post request to update the user profile with some new data
    const response = await request(app)
      .post('/user/profile')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({
        name: 'Jane Doe',
        location: 'Los Angeles',
        phone: '987-654-3210',
        interests: ['Art', 'Travel', 'Sports'],
        password: 'newPassword',
        profilePicture: 'https://example.com/newImage.jpg',
      });

    // Expect the response status to be 500
    expect(response.status).toBe(500);

    // Expect the response message to be 'An error occurred during profile update.'
    expect(response.body.message).toBe(
      'An error occurred during profile update.'
    );
  });
});

// Test the getUserProfile function
describe('getUserProfile', () => {
  // Test the success case
  test('should return the user profile successfully', async () => {
    // Mock the User.findById method to return the mock user
    User.findById.mockResolvedValue(mockUser);

    // Make a get request to get the user profile by id
    const response = await request(app).get(`/user/profile/${mockUser.id}`);

    // Expect the response status to be 200
    expect(response.status).toBe(200);

    // Expect the response body to contain the relevant profile data
    expect(response.body).toEqual({
      name: mockUser.name,
      profilePicture: mockUser.profilePicture,
      location: mockUser.location,
      dateOfBirth: mockUser.dateOfBirth,
      email: mockUser.email,
      phoneNumber: mockUser.phoneNumber,
      interests: mockUser.interests,
      googleAccount: 'Not connected',
    });
  });

  // Test the failure case when the user does not exist
  test('should return an error if the user does not exist', async () => {
    // Mock the User.findById method to return null
    User.findById.mockResolvedValue(null);

    // Make a get request to get the user profile by id
    const response = await request(app).get(`/user/profile/${mockUser.id}`);

    // Expect the response status to be 404
    expect(response.status).toBe(404);

    // Expect the response error to be 'User not found'
    expect(response.body.error).toBe('User not found');
  });

  // Test the failure case when there is a server error
  test('should return an error if there is a server error', async () => {
    // Mock the User.findById method to throw an error
    User.findById.mockRejectedValue(new Error('Server error'));

    // Make a get request to get the user profile by id
    const response = await request(app).get(`/user/profile/${mockUser.id}`);

    // Expect the response status to be 500
    expect(response.status).toBe(500);

    // Expect the response error to be 'Server error'
    expect(response.body.error).toBe('Server error');
  });

  // Override the app routes to use the mock middleware and the mock User model
  app.post('/api/google', mockAuth, async (req, res) => {
    await connectGoogleAccount(req, res, User);
  });

  app.post('/api/logout', logout);

  // Test the connectGoogleAccount function
  describe('connectGoogleAccount', () => {
    // Test the success case
    test('should connect the Google account successfully', async () => {
      // Mock the User.findOne method to return the mock user
      User.findOne.mockResolvedValue(mockUser);

      // Mock the user.save method to return a promise
      mockUser.save.mockResolvedValue();

      // Make a post request to connect the Google account with a Google ID
      const response = await request(app)
        .post('/api/google')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ googleId: '456' });

      // Expect the response status to be 200
      expect(response.status).toBe(200);

      // Expect the response message to be 'Google account successfully connected.'
      expect(response.body.message).toBe(
        'Google account successfully connected.'
      );

      // Expect the user's Google ID to be updated
      expect(mockUser.googleId).toBe('456');
    });

    // Test the failure case when the user does not exist
    test('should return an error if the user does not exist', async () => {
      // Mock the User.findOne method to return null
      User.findOne.mockResolvedValue(null);

      // Make a post request to connect the Google account with a Google ID
      const response = await request(app)
        .post('/api/google')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ googleId: '456' });

      // Expect the response status to be 404
      expect(response.status).toBe(404);

      // Expect the response message to be 'User not found.'
      expect(response.body.message).toBe('User not found.');
    });

    // Test the failure case when there is a server error
    test('should return an error if there is a server error', async () => {
      // Mock the User.findOne method to throw an error
      User.findOne.mockRejectedValue(new Error('Server error'));

      // Make a post request to connect the Google account with a Google ID
      const response = await request(app)
        .post('/api/google')
        .set('Authorization', `Bearer ${mockToken}`)
        .send({ googleId: '456' });

      // Expect the response status to be 500
      expect(response.status).toBe(500);

      // Expect the response message to be 'An error occurred during Google account connection.'
      expect(response.body.message).toBe(
        'An error occurred during Google account connection.'
      );
    });
  });

  // Test the logout function
  describe('logout', () => {
    // Test the success case
    test('should log out the user successfully', async () => {
      // Make a post request to log out the user
      const response = await request(app).post('/api/logout');

      // Expect the response status to be 200
      expect(response.status).toBe(200);

      // Expect the response message to be 'Logged out successfully.'
      expect(response.body.message).toBe('Logged out successfully.');

      // Expect the cookie to be cleared
      expect(response.headers['set-cookie']).toEqual([
        'jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      ]);
    });
  });
});
