const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/Users');
const sendEmail = require('../middleware/email');

// User signup
// This is when user wants to signup using email and password.
// Signing up through Google will be handled by the gAuth.js middleware.
const signup = async (req, res) => {
  try {
    const { name, email, password, passwordConfirmation } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ error: 'User email already exists.' });
    }

    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
    });

    await user.save();

    await sendEmail(
      user.email,
      'Welcome to Impakt!',
      `Dear ${user.name}, your Impakt account has been created successfully.`
    );

    const token = jwt.sign(
      {
        name: user.name,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 1209600, // 14 days expiration
        iat: Math.floor(Date.now() / 1000), // Issued at date
      },
      process.env.JWT_SECRET
    );

    res.cookie('jwt', token, { httpOnly: true });

    res.redirect('/dashboard');
    return res.status(201).json({ token });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// User login
// This is when user wants to login using email and password.
// Signing in through Google will be handled by the gAuth.js middleware.
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      return res.status(404).json({ error: "User doesn't exist." });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

    const user = await User.findOne({ email });

    const token = jwt.sign(
      {
        name: user.name,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 1209600, // 14 days expiration
        iat: Math.floor(Date.now() / 1000), // Issued at date
      },
      process.env.JWT_SECRET
    );

    res.cookie('jwt', token, { httpOnly: true });

    res.redirect('/dashboard');

    return res.status(201).json({ token });
  } catch (error) {
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};

// Update user profile
const updateUserProfile = async (req, res, next) => {
  const userId = req.user.id;
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    user.set(req.body); // Update user with the provided data
    const updatedUser = await user.save(); // Save the updated user to the database

    return res.status(200).json(updatedUser);
  } catch (error) {
    return next(error);
  }
};

// user profile
const getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user in the database
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract the relevant profile data
    // To @abdulsalamhamandoush22: @omikay made some changes here
    // const { name, email, ProfilePic, age } = user;
    const profileData = {
      name: user.name,
      email: user.email,
      profilePic: user.profilePic,
      dateOfBirth: user.dateOfBirth,
      // This has to be changed: we cannot show interest IDs
      // NOTE
      interests: user.interestIds,
    };

    // Return the user's profile
    return res.status(200).json(profileData);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// User logout
const logout = (req, res) => {
  res.clearCookie('jwt');
  return res.status(200).json({ message: 'Logged out successfully.' }).redirect('/api/login');
};

module.exports = { updateUserProfile, signup, login, getUserProfile, logout };
