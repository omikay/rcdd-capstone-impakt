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

// Create a mock middleware to authenticate the user
const mockAuth = (req, res, next) => {
  req.user = { id: mockUser.id };
  next();
};

app.post('/user/profile', mockAuth, async (req, res) => {
  await updateUserProfile(req, res);
});

app.get('/user/profile/:id', async (req, res) => {
  await getUserProfile(req, res);
});

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
    // User.mockImplementationOnce(() => mockUser);
    const userSaveFn = jest.fn();
    User.mockImplementationOnce((data) => ({
      name: data.name,
      email: data.email,
      password: data.password,
      save: userSaveFn,
    }));
    jwt.sign.mockReturnValueOnce(mockToken);

    await signup(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(User).toHaveBeenCalledWith({
      name: req.body.name,
      email: req.body.email,
      password: mockHashedPassword,
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
      `Dear ${req.body.name}, your Impakt account has been created successfully.`
    );
    expect(res.cookie).toHaveBeenCalledWith('jwt', mockToken, {
      httpOnly: true,
    });
    // expect(res.redirect).toHaveBeenCalledWith('/user/profile/:id');
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
    };

    User.findOne.mockResolvedValueOnce(existingUser);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      await bcrypt.hash(req.body.password, 10),
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
    };

    User.findOne.mockResolvedValueOnce(existingUser);
    bcrypt.compare.mockResolvedValueOnce(false);

    await login(req, res);

    expect(User.findOne).toHaveBeenCalledWith({ email: req.body.email });
    expect(bcrypt.compare).toHaveBeenCalledWith(
      await bcrypt.hash(req.body.password, 10),
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
      dateOfBirth: mockUser.dateOfBirth,
      email: mockUser.email,
      phoneNumber: mockUser.phoneNumber,
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
