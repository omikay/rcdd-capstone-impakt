const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = require('../../app');
const User = require('../../models/Users');
const sendEmail = require('../../utils/email');
const {
  connectGoogleAccount,
  logout,
  getUserProfile,
  updateUserProfile,
  signup,
  login,
} = require('../userController');

jest.mock('../../config/db');
jest.mock('../../models/Users');
jest.mock('../../utils/email');

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
jest.mock('jsonwebtoken');

const mockToken = 'abc';

const mockAuth = (req, res, next) => {
  req.user = { id: mockUser.id };
  next();
};

app.post('/user/profile', mockAuth, async (req, res) => {
  await updateUserProfile(req, res, User);
});

app.get('/user/profile/:id', async (req, res) => {
  await getUserProfile(req, res, User);
});

describe('updateUserProfile', () => {
  test('should update the user profile successfully', async () => {
    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(false);
    bcrypt.hash.mockResolvedValue('hashedPassword');

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

    console.log('User:', await User.findById(mockUser.id));

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Profile updated successfully.');
    expect(mockUser.name).toBe('Jane Doe');
    expect(mockUser.location).toBe('Los Angeles');
    expect(mockUser.phone).toBe('987-654-3210');
    expect(mockUser.interests).toEqual(['Art', 'Travel', 'Sports']);
    expect(mockUser.password).toBe('hashedPassword');
    expect(mockUser.profilePicture).toBe('https://example.com/newImage.jpg');

    bcrypt.compare.mockRestore();
    bcrypt.hash.mockRestore();
  });

  test('should return an error if the user does not exist', async () => {
    User.findById.mockResolvedValue(null);

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

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found.');
  });

  test('should return an error if the new password matches the previous password', async () => {
    User.findById.mockResolvedValue(mockUser);
    bcrypt.compare.mockResolvedValue(true);

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

    console.log('User:', await User.findById(mockUser.id));

    expect(response.status).toBe(400);
    expect(response.body.message).toBe(
      'New password cannot be the same as the previous password.'
    );

    bcrypt.compare.mockRestore();
  });

  test('should return an error if there is a server error', async () => {
    User.findById.mockRejectedValue(new Error('Server error'));

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

    expect(response.status).toBe(500);
    expect(response.body.message).toBe(
      'An error occurred during profile update.'
    );
  });
});

describe('getUserProfile', () => {
  test('should return the user profile successfully', async () => {
    User.findById.mockResolvedValue(mockUser);

    const response = await request(app).get(`/user/profile/${mockUser.id}`);

    expect(response.status).toBe(200);
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

  test('should return an error if the user does not exist', async () => {
    User.findById.mockResolvedValue(null);

    const response = await request(app).get(`/user/profile/${mockUser.id}`);

    expect(response.status).toBe(404);
    expect(response.body.error).toBe('User not found');
  });

  test('should return an error if there is a server error', async () => {
    User.findById.mockRejectedValue(new Error('Server error'));

    const response = await request(app).get(`/user/profile/${mockUser.id}`);

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Server error');
  });
});

app.post('/api/google', mockAuth, async (req, res) => {
  await connectGoogleAccount(req, res, User);
});

app.post('/api/logout', logout);

describe('connectGoogleAccount', () => {
  test('should connect the Google account successfully', async () => {
    User.findOne.mockResolvedValue(mockUser);
    mockUser.save.mockResolvedValue();

    const response = await request(app)
      .post('/api/google')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ googleId: '456' });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe(
      'Google account successfully connected.'
    );
    expect(mockUser.googleId).toBe('456');
  });

  test('should return an error if the user does not exist', async () => {
    User.findOne.mockResolvedValue(null);

    const response = await request(app)
      .post('/api/google')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ googleId: '456' });

    expect(response.status).toBe(404);
    expect(response.body.message).toBe('User not found.');
  });

  test('should return an error if there is a server error', async () => {
    User.findOne.mockRejectedValue(new Error('Server error'));

    const response = await request(app)
      .post('/api/google')
      .set('Authorization', `Bearer ${mockToken}`)
      .send({ googleId: '456' });

    expect(response.status).toBe(500);
    expect(response.body.message).toBe(
      'An error occurred during Google account connection.'
    );
  });
});

describe('logout', () => {
  test('should log out the user successfully', async () => {
    const response = await request(app).post('/api/logout');

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully.');
    expect(response.headers['set-cookie']).toEqual([
      'jwt=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ]);
  });
});

describe('signup', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        name: 'John Doe',
        email: 'johndoe@example.com',
        password: 'password123',
        passwordConfirmation: 'password123',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
  });

  it('should create a new user, send an email, and return a token if all inputs are valid', async () => {
    const mockHashedPassword = 'hashedPassword';
    sendEmail.mockResolvedValueOnce();
    bcrypt.hash.mockResolvedValueOnce(mockHashedPassword);
    User.findOne.mockResolvedValueOnce(null);
    User.mockImplementationOnce(() => mockUser);
    jwt.sign.mockReturnValueOnce(mockToken);

    User.findById.mockReturnValueOnce(mockUser);

    await signup(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(User).toHaveBeenCalledWith({
      name: req.body.name,
      email: req.body.email,
      password: mockHashedPassword,
    });
    expect(mockUser.save).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        name: req.body.name,
        email: req.body.email,
        exp: expect.any(Number),
        iat: expect.any(Number),
      },
      process.env.JWT_SECRET
    );
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(req.body.email);
    expect(res.cookie).toHaveBeenCalledWith('jwt', mockToken, {
      httpOnly: true,
    });
    expect(res.redirect).toHaveBeenCalledWith('/user/profile/:id');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ token: mockToken });
  });

  it('should return an error if the user email already exists', async () => {
    User.findOne.mockResolvedValueOnce({ email: req.body.email });

    await signup(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'User email already exists.',
    });
  });

  it('should return an error if passwords do not match', async () => {
    req.body.passwordConfirmation = 'differentPassword';

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Passwords do not match.' });
  });

  it('should return an error if an exception occurs', async () => {
    const mockError = new Error('Something went wrong');

    User.findOne.mockRejectedValueOnce(mockError);

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('should return an error if passwords is not strong', async () => {
    req.body.password = 'weakpassword';
    await signup(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Password is not strong enough.',
    });
  });
});

describe('login', () => {
  const mockRequest = (body) => ({ body });
  const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.cookie = jest.fn();
    res.redirect = jest.fn();
    return res;
  };

  it('should log in a user and redirect to dashboard', async () => {
    const existingUser = {
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    };
    const req = mockRequest({
      email: 'test@example.com',
      password: 'password123',
    });
    const res = mockResponse();

    User.findOne = jest.fn().mockResolvedValue(existingUser);
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    jwt.sign = jest.fn().mockReturnValue(mockToken);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'password123',
      existingUser.password
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        email: 'test@example.com',
        exp: expect.any(Number),
        iat: expect.any(Number),
      },
      process.env.JWT_SECRET
    );
    expect(res.cookie).toHaveBeenCalledWith('jwt', mockToken, {
      httpOnly: true,
    });
    expect(res.redirect).toHaveBeenCalledWith('/user/:id/profile');
  });

  it('should return an error if the user does not exist', async () => {
    const req = mockRequest({
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    const res = mockResponse();

    User.findOne = jest.fn().mockResolvedValue(null);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({
      email: 'nonexistent@example.com',
    });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User doesn't exist." });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('should return an error if the password is incorrect', async () => {
    const existingUser = {
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    };
    const req = mockRequest({
      email: 'test@example.com',
      password: 'incorrect-password',
    });
    const res = mockResponse();

    User.findOne = jest.fn().mockResolvedValue(existingUser);
    bcrypt.compare = jest.fn().mockResolvedValue(false);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      'incorrect-password',
      existingUser.password
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials.' });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });

  it('should handle errors', async () => {
    const req = mockRequest({
      email: 'test@example.com',
      password: 'password123',
    });
    const res = mockResponse();

    User.findOne = jest.fn().mockRejectedValue(new Error('Database error'));

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Something went wrong.' });
    expect(res.cookie).not.toHaveBeenCalled();
    expect(res.redirect).not.toHaveBeenCalled();
  });
});
