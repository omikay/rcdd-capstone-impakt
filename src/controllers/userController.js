const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/Users');
const sendEmail = require('../utils/email');

const validatePasswordStrength = (password) => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// User signup
// This is when user wants to signup using email and password.
// Signing up through Google will be handled by the googleOAuth.js.
const signup = async (req, res) => {
  try {
    const { name, email, password, passwordConfirmation } = req.body;

    let user = await User.findOne({ email });

    if (user) {
      return res.status(400).json({ error: 'User email already exists.' });
    }
    const isStrongPassword = validatePasswordStrength(req.body.password);
    if (!isStrongPassword) {
      return res.status(400).json({ error: 'Password is not strong enough.' });
    }

    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // console.log(user);
    user = new User({
      name,
      email,
      password: hashedPassword,
    });
    // console.log(user, req);
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

    return res.status(201).json({ token });
  } catch (error) {
    // console.error('Error signing up user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// User login
// This is when user wants to login using email and password.
// Signing in through Google will be handled by the googleOAuth.js.
const login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: "User doesn't exist." });
    }
    const hashedReqPass = await bcrypt.hash(password);
    const isPasswordCorrect = await bcrypt.compare(
      hashedReqPass,
      user.password
    );
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }
    console.log(user);
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

    return res.status(200).json({ token });
  } catch (error) {
    // console.error('Error logging in user:', error);
    return res.status(500).json({ error: 'Something went wrong.' });
  }
};

// Update user profile
const updateUserProfile = async (req, res) => {
  const { name, location, phone, interests, password, profilePicture } =
    req.body;

  try {
    // Retrieve the user from the database based on the authenticated user's ID
    const user = await User.findById(req.user.id);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update the user profile fields
    user.name = name;
    user.location = location;
    user.phone = phone;
    user.interests = interests;
    user.profilePicture = profilePicture;

    // Check if a new password is provided
    if (password) {
      // Check if the new password matches the previous password
      const isPasswordMatch = await bcrypt.compare(password, user.password);
      if (isPasswordMatch) {
        return res.status(400).json({
          message: 'New password cannot be the same as the previous password.',
        });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    // Save the updated user profile to the database
    await user.save();

    return res.status(200).json({ message: 'Profile updated successfully.' });
  } catch (error) {
    // console.error('Error updating user profile:', error);
    return res
      .status(500)
      .json({ message: 'An error occurred during profile update.' });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user in the database
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract the relevant profile data
    const userProfileData = {
      name: user.name,
      profilePicture: user.profilePicture,
      location: user.location,
      dateOfBirth: user.dateOfBirth,
      email: user.email,
      phoneNumber: user.phoneNumber,
      interests: user.interests,
      googleAccount: user.googleId ? 'Connected' : 'Not connected',
    };

    // Return the user's profile
    return res.status(200).json(userProfileData);
  } catch (error) {
    return res.status(500).json({ error: 'Server error' });
  }
};

// Connect google account
// For users who did not signup with google
const connectGoogleAccount = async (req, res) => {
  const { googleId } = req.body;

  try {
    // Find the user by their email
    const user = await User.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update the user with the Google ID
    user.googleId = googleId;
    await user.save();

    return res
      .status(200)
      .json({ message: 'Google account successfully connected.' });
  } catch (error) {
    // console.error('Error connecting Google account:', error);
    return res
      .status(500)
      .json({ message: 'An error occurred during Google account connection.' });
  }
};

// User logout
const logout = (req, res) => {
  try {
    res.clearCookie('jwt');
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error('Error logging out user:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while logging out.' });
  }
};

module.exports = {
  signup,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
  connectGoogleAccount,
};
