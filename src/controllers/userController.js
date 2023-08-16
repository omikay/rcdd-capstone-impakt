const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const server = require('../../app');
const User = require('../../models/Users');
const sendEmail = require('../../utils/email');
const {
  connectGoogleAccount,
  logout,
  getUserProfile,
  updateUserProfile,
  signup,
  login,
  activateUser,
  resetPassword,
  forgotPassword,
} = require('../userController');

jest.mock('bcrypt');
jest.mock('../../models/Users');
jest.mock('../../utils/email');
jest.mock('jsonwebtoken');

const mockUser = {
  id: '123',
  name: 'John Doe',
  location: 'New York',
  phone: '123-456-7890',
  email: 'john.doe@mockUser.com',
  interests: ['Music', 'Movies', 'Books'],
  password: '3@3!asgGe3',
  googleId: null,
  profilePicture: 'https://example.com/image.jpg',
  save: jest.fn(),
};

const mockToken = 'abc';

// Mock the bcrypt methods
bcrypt.compare.mockImplementation((password, hashedPassword) =>
  Promise.resolve(password === hashedPassword)
);
bcrypt.hash.mockImplementation((password) =>
  Promise.resolve(`hashed(${password})`)
);

// Mock the jwt methods
jwt.sign.mockImplementation(() => mockToken);

// Mock the sendEmail function
sendEmail.mockResolvedValue();

afterAll(async () => {
  // Cleanup code to close the server
  await server.close();
});

// Test the signup function
describe('signup', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        name: 'John Doe',
        email: 'john.doe@signup.com',
        password: '!erRE45@sfgGG',
        passwordConfirmation: '!erRE45@sfgGG',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should save the user info, send the welcome email, and save a token.', async () => {
    const mockHashedPassword = 'hashedPassword';
    sendEmail.mockResolvedValueOnce();
    bcrypt.hash.mockResolvedValueOnce(mockHashedPassword);
    User.findOne.mockResolvedValueOnce(null);
    const userSaveFn = jest.fn();
    User.mockImplementationOnce((data) => ({
      name: data.name,
      email: data.email,
      password: data.password,
      accountCreatedOn: data.accountCreatedOn,
      save: userSaveFn,
    }));
    jwt.sign.mockReturnValueOnce(mockToken);

    await signup(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(User).toHaveBeenCalledWith({
      name: req.body.name,
      email: req.body.email,
      password: mockHashedPassword,
      accountCreatedOn: expect.any(Number),
    });
    expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 10);
    expect(userSaveFn).toHaveBeenCalled();
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        name: req.body.name,
        email: req.body.email,
        exp: expect.any(Number),
        iat: expect.any(Number),
      },
      process.env.JWT_SECRET
    );
    expect(sendEmail).toHaveBeenCalledWith(
      req.body.email,
      'Welcome to Impakt!',
      `Hi ${req.body.name}, you have been signed up successfully. Please click on the following link to activate your account: 
      
      ${process.env.CLIENT_URL}/verify-account/${mockToken}
      
      The activation link is valid for 2 days after the sign-up attempt.`
    );

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message: 'User signed up successfully. Activate account to login.',
    });
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
    req.body.passwordConfirmation = '!weRET4242er@';

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Passwords do not match.' });
  });

  it('should return an error if there is a server error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('Internal server error'));

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
  });

  it('should return an error if the password is not strong enough', async () => {
    req.body.password = 'weakpassword';

    await signup(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Password is not strong enough.',
    });
  });
});

describe('activateUser', () => {
  const mockActiveUser = {
    name: 'non active',
    email: 'non.active@activateUser.com',
    isVerified: false,
    save: jest.fn(),
  };
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should activate the user account when the token is valid and not expired', async () => {
    const req = {
      params: { token: mockToken },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const decodedToken = { email: 'john.doe@mockUser.com' };

    jwt.verify.mockReturnValue(decodedToken);
    User.findOne.mockResolvedValueOnce(mockActiveUser);

    await activateUser(req, res);

    expect(jwt.verify).toHaveBeenCalledWith(
      req.params.token,
      process.env.JWT_SECRET
    );
    expect(User.findOne).toHaveBeenCalledWith({ email: decodedToken.email });
    expect(mockActiveUser.isVerified).toBe(true);
    // expect(mockActiveUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      message:
        'Account activated successfully. You can now log into your account.',
    });
  });

  it('should return a new activation link when the token is expired', async () => {
    const req = {
      params: { token: mockToken },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the verify method of jwt to throw a TokenExpiredError
    jwt.verify.mockImplementation(() => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    jwt.decode.mockReturnValueOnce({
      email: mockActiveUser.email,
      name: mockActiveUser.name,
    });

    jwt.sign.mockReturnValueOnce(mockToken);

    await activateUser(req, res);

    expect(jwt.verify).toHaveBeenCalledWith(
      req.params.token,
      process.env.JWT_SECRET
    );

    expect(jwt.decode).toHaveBeenCalledWith(req.params.token);
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        name: mockActiveUser.name,
        email: mockActiveUser.email,
        exp: expect.any(Number),
        iat: expect.any(Number),
      },
      process.env.JWT_SECRET
    );

    expect(sendEmail).toHaveBeenCalledWith(
      mockActiveUser.email,
      'Activation required for your Impakt account',
      `Hi ${mockActiveUser.name},\n\nYour activation link has expired. Please click on the following link to activate your account:\n\n${process.env.CLIENT_URL}/verify-account/${mockToken}\n\nThe activation link is valid for 2 days.`
    );

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error:
        'Activation link has expired. A new link has been sent to your email.',
    });
  });

  it('should return an error if the user is already activated', async () => {
    const activeUser = {
      name: 'John Doe',
      email: 'john.doe@activateUser.com',
      isVerified: true,
    };

    const req = {
      params: { token: mockToken },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jwt.verify.mockReturnValue(activeUser);
    User.findOne.mockResolvedValueOnce(activeUser);

    await activateUser(req, res);

    expect(jwt.verify).toHaveBeenCalledWith(
      req.params.token,
      process.env.JWT_SECRET
    );

    expect(User.findOne).toHaveBeenCalledWith({ email: activeUser.email });

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Account already activated.',
    });
  });

  it('should return a 404 error if the user is not found', async () => {
    const req = {
      params: { token: mockToken },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const decodedToken = { email: 'non.user@activateUser.com' };

    jwt.verify.mockReturnValue(decodedToken);
    User.findOne.mockResolvedValueOnce(null);

    await activateUser(req, res);

    expect(jwt.verify).toHaveBeenCalledWith(
      req.params.token,
      process.env.JWT_SECRET
    );
    expect(User.findOne).toHaveBeenCalledWith({ email: decodedToken.email });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found.' });
  });

  it('should return a 500 error on internal server error', async () => {
    const req = {
      params: { token: mockToken },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jwt.verify.mockImplementation(() => {
      throw new Error('Some server error');
    });

    await activateUser(req, res);

    // Check that the API returns the correct error response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error.' });
  });
});

// Test the login function
describe('login', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      body: {
        email: 'john.doe@login.com',
        password: 'password123',
      },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log in a user and redirect to profile', async () => {
    const existingUser = {
      name: 'John Doe',
      email: 'john.doe@login.com',
      password: await bcrypt.hash('password123', 10),
      isVerified: true,
    };

    User.findOne.mockResolvedValueOnce(existingUser);
    bcrypt.compare.mockResolvedValueOnce(true);
    jwt.sign.mockReturnValueOnce(mockToken);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      req.body.password,
      existingUser.password
    );
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        name: existingUser.name,
        email: existingUser.email,
        exp: expect.any(Number),
        iat: expect.any(Number),
      },
      process.env.JWT_SECRET
    );
    expect(res.cookie).toHaveBeenCalledWith('jwt', mockToken, {
      httpOnly: true,
    });
    // expect(res.redirect).toHaveBeenCalledWith('/user/:id/profile');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ token: mockToken });
  });

  it('should return an error if the user does not exist', async () => {
    User.findOne.mockResolvedValueOnce(null);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "User doesn't exist.",
    });
  });

  it('should return an error if the password is incorrect', async () => {
    const existingUser = {
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      isVerified: true,
    };

    User.findOne.mockResolvedValueOnce(existingUser);
    bcrypt.compare.mockResolvedValueOnce(false);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      req.body.password,
      existingUser.password
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Invalid credentials.',
    });
  });

  it('should return an error if there is a server error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('Something went wrong'));

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Something went wrong.',
    });
  });
});

// Test the getUserProfile function
describe('getUserProfile', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: { id: mockUser.id },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the user profile successfully', async () => {
    User.findById.mockResolvedValueOnce(mockUser);

    await getUserProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      name: mockUser.name,
      profilePicture: mockUser.profilePicture,
      location: mockUser.location,
      dateOfBirth: mockUser.dob,
      email: mockUser.email,
      phoneNumber: mockUser.phone,
      interests: mockUser.interests,
      googleAccount: 'Not connected',
    });
  });

  it('should return an error if the user does not exist', async () => {
    User.findById.mockResolvedValueOnce(null);

    await getUserProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
  });

  it('should return an error if there is a server error', async () => {
    User.findById.mockRejectedValueOnce(new Error('Server error'));

    await getUserProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.params.id);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server error' });
  });
});

// Test the updateUserProfile function
describe('updateUserProfile', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { id: mockUser.id },
      body: {
        name: 'Jaba Jaba Doe',
        location: 'Los Angeles',
        phone: '987-654-3210',
        interests: ['Art', 'Travel', 'Sports'],
        password: '124!gdfRt3@',
        profilePicture: 'https://example.com/newImage.jpg',
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

  it('should update the user profile successfully', async () => {
    User.findById.mockResolvedValueOnce(mockUser);

    await updateUserProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.user.id);
    expect(mockUser.name).toBe(req.body.name);
    expect(mockUser.location).toBe(req.body.location);
    expect(mockUser.phone).toBe(req.body.phone);
    expect(mockUser.interests).toEqual(req.body.interests);
    expect(mockUser.password).toBe(`hashed(${req.body.password})`);
    expect(mockUser.profilePicture).toBe(req.body.profilePicture);
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Profile updated successfully.',
    });
  });

  it('should return an error if the user does not exist', async () => {
    User.findById.mockResolvedValueOnce(null);

    await updateUserProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.user.id);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
  });

  it('should return an error if the new password matches the previous password', async () => {
    User.findById.mockResolvedValueOnce(mockUser);
    bcrypt.compare.mockResolvedValueOnce(true);

    await updateUserProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.user.id);
    expect(bcrypt.compare).toHaveBeenCalledWith(
      req.body.password,
      mockUser.password
    );
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: 'New password cannot be the same as the previous password.',
    });
  });

  it('should return an error if there is a server error', async () => {
    User.findById.mockRejectedValueOnce(new Error('Server error'));

    await updateUserProfile(req, res);

    expect(User.findById).toHaveBeenCalledWith(req.user.id);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'An error occurred during profile update.',
    });
  });
});

// Test the connectGoogleAccount function
describe('connectGoogleAccount', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      user: { email: mockUser.email },
      body: { googleId: 'google123' },
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should connect the Google account successfully', async () => {
    User.findOne.mockResolvedValueOnce(mockUser);

    await connectGoogleAccount(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.user.email });
    expect(mockUser.googleId).toBe(req.body.googleId);
    expect(mockUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Google account successfully connected.',
    });
  });

  it('should return an error if the user does not exist', async () => {
    User.findOne.mockResolvedValueOnce(null);

    await connectGoogleAccount(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.user.email });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
  });

  it('should return an error if there is a server error', async () => {
    User.findOne.mockRejectedValueOnce(new Error('Server error'));

    await connectGoogleAccount(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.user.email });
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'An error occurred during Google account connection.',
    });
  });
});

describe('forgotPassword', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  it('should send a password reset email when the user exists', async () => {
    const req = {
      body: {
        email: 'john.doe@mockUser.com',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    // Mock the findOne method of the User model to return the mock user
    jwt.sign.mockReturnValueOnce(mockToken);
    User.findOne.mockResolvedValueOnce(mockUser);

    await forgotPassword(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(jwt.sign).toHaveBeenCalledWith(
      {
        email: req.body.email,
        expiresIn: '1h',
      },
      process.env.JWT_SECRET
    );

    expect(sendEmail).toHaveBeenCalledWith(
      mockUser.email,
      'Password Reset Request',
      `Hi ${mockUser.name},\n\nTo reset your password, click the link below:\n\nhttps://plankton-app-e3b4u.ondigitalocean.app/reset-password/${mockToken}\n\nThe link is valid for 1 hour.\n\nYou may neglect this email if you did not make this request.`
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password reset email sent.',
    });
  });

  it('should return a 404 error when the user does not exist', async () => {
    const req = {
      body: {
        email: 'non-user@mockUser.com',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jwt.sign.mockReturnValueOnce(mockToken);
    User.findOne.mockResolvedValueOnce(null);

    await forgotPassword(req, res);

    expect(jwt.sign).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found.' });
  });

  it('should return a 500 error if there is a server error', async () => {
    const req = {
      body: {
        email: 'non-user@mockUser.com',
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jwt.sign.mockRejectedValueOnce(new Error('Internal server error'));
    User.findOne.mockRejectedValueOnce(new Error('Internal server error'));

    await forgotPassword(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error.' });
  });
});

describe('resetPassword', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should reset the password when the token is valid and passwords match', async () => {
    const req = {
      body: {
        password: '!erBR45@sfgGG',
        passwordConfirmation: '!erBR45@sfgGG',
      },
      params: {
        token: mockToken,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const decodedToken = { email: 'john.doe@mockUser.com' };
    jwt.verify.mockReturnValue(decodedToken);
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.hash.mockResolvedValue('!erBR45@sfgGG');

    await resetPassword(req, res);

    expect(jwt.verify).toHaveBeenCalledWith(
      req.params.token,
      process.env.JWT_SECRET
    );
    expect(User.findOne).toHaveBeenCalledWith({ email: decodedToken.email });
    expect(bcrypt.hash).toHaveBeenCalledWith(req.body.password, 10);

    expect(mockUser.save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Password reset successful.',
    });
  });

  it('should return a 404 error when the user does not exist', async () => {
    const req = {
      body: {
        password: '!erBR45@sfgGG',
        passwordConfirmation: '!erBR45@sfgGG',
      },
      params: {
        token: mockToken,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jwt.verify.mockReturnValueOnce(mockToken, process.env.JWT_SECRET);
    User.findOne.mockResolvedValueOnce(null);

    await resetPassword(req, res);

    expect(jwt.verify).toHaveBeenCalledWith(
      req.params.token,
      process.env.JWT_SECRET
    );

    expect(sendEmail).not.toHaveBeenCalled();

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'User not found.' });
  });

  it('should return a 400 error when the passwords do not match', async () => {
    const req = {
      body: {
        password: '!erBR45@sfgGG',
        passwordConfirmation: 'not-matching',
      },
      params: {
        token: mockToken,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    const decodedToken = { email: 'john.doe@mockUser.com' };
    jwt.verify.mockReturnValue(decodedToken);
    User.findOne.mockResolvedValue(mockUser);
    bcrypt.hash.mockResolvedValue('!erBR45@sfgGG');

    await resetPassword(req, res);

    expect(jwt.verify).toHaveBeenCalledWith(
      req.params.token,
      process.env.JWT_SECRET
    );
    expect(User.findOne).toHaveBeenCalledWith({ email: mockUser.email });

    // Check that the API returns the correct error response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Passwords do not match.' });
  });

  it('should return a 400 error when the token is expired', async () => {
    const req = {
      body: {
        password: '!erBR45@sfgGG',
        passwordConfirmation: 'not-matching',
      },
      params: {
        token: mockToken,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    // Mock the verify method of jwt to throw a TokenExpiredError
    jwt.verify.mockImplementation(() => {
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      throw error;
    });

    await resetPassword(req, res);

    expect(jwt.verify).toHaveBeenCalledWith(
      req.params.token,
      process.env.JWT_SECRET
    );
    // Check that the API returns the correct error response
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Password reset link has expired.',
    });
  });

  it('should return a 500 error when there is a server error', async () => {
    const req = {
      body: {
        password: '!erBR45@sfgGG',
        passwordConfirmation: '!erBR45@sfgGG',
      },
      params: {
        token: mockToken,
      },
    };

    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    jwt.verify.mockImplementation(() => {
      throw new Error('Some server error');
    });
    User.findOne.mockRejectedValueOnce(new Error('Server error'));

    await resetPassword(req, res);

    // Check that the API returns the correct error response
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error.' });
  });
});

// Test the logout function
describe('logout', () => {
  let res;

  beforeEach(() => {
    res = {
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should log out the user successfully', () => {
    logout({}, res);

    expect(res.clearCookie).toHaveBeenCalledWith('jwt');
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      message: 'Logged out successfully.',
    });
  });
});
