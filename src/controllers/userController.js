const process = require('process');
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

    user = new User({
      name,
      email,
      password: hashedPassword,
      accountCreatedOn: Date.now(),
    });

    await user.save();

    // Generate an account activation token
    const activationToken = jwt.sign(
      {
        name: user.name,
        email: user.email,
        exp: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60, // 2 days expiration
        iat: Math.floor(Date.now() / 1000), // Issued at date
      },
      process.env.JWT_SECRET
    );

    // Create a password reset URL that includes the generated token
    const activationLink = `${process.env.CLIENT_URL}/verify-account/${activationToken}`;

    await sendEmail(
      user.email,
      'Welcome to Impakt!',
      `Hi ${user.name}, you have been signed up successfully. Please click on the following link to activate your account: 
      
      ${activationLink}
      
      The activation link is valid for 2 days after the sign-up attempt.`
    );

    return res.status(201).json({
      message: 'User signed up successfully. Activate account to login.',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' });
  }
};

// User account activation after sign up
// This is when the user sign ups with their email and not GoogleOAuth
const activateUser = async (req, res) => {
  const { token } = req.params;
  try {
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // Find the user by their email
    const user = await User.findOne({ email: decodedToken.email });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    if (user.isVerified === true) {
      return res.status(400).json({ error: 'Account already activated.' });
    }

    // Mark the user as verified
    user.isVerified = true;

    await user.save();
    return res.status(201).json({
      message:
        'Account activated successfully. You can now log into your account.',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      const decodedToken = jwt.decode(token);
      const newToken = jwt.sign(
        {
          name: decodedToken.name,
          email: decodedToken.email,
          exp: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60, // 2 days expiration
          iat: Math.floor(Date.now() / 1000), // Issued at date
        },
        process.env.JWT_SECRET
      );

      const activationLink = `${process.env.CLIENT_URL}/verify-account/${newToken}`;

      await sendEmail(
        decodedToken.email,
        'Activation required for your Impakt account',
        `Hi ${decodedToken.name},\n\nYour activation link has expired. Please click on the following link to activate your account:\n\n${activationLink}\n\nThe activation link is valid for 2 days.`
      );
      return res.status(400).json({
        error:
          'Activation link has expired. A new link has been sent to your email.',
      });
    }
    return res.status(500).json({ error: 'Internal server error.' });
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

    // Check if the user's account is verified
    if (!user.isVerified) {
      // Generate an account activation token
      const activationToken = jwt.sign(
        {
          name: user.name,
          email: user.email,
          exp: Math.floor(Date.now() / 1000) + 2 * 24 * 60 * 60, // 2 days expiration
          iat: Math.floor(Date.now() / 1000), // Issued at date
        },
        process.env.JWT_SECRET
      );

      // Create a password reset URL that includes the generated token
      const activationLink = `${process.env.CLIENT_URL}/verify-account/${activationToken}`;

      await sendEmail(
        user.email,
        'Account activation required',
        `Dear ${user.name},       
        Please click on the following link to activate your account to be able to use your account.

        ${activationLink}       
        The activation link is valid for 2 days.`
      );
      return res.status(401).json({
        error:
          'Account is not verified. Please check your email for the new activation link.',
      });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(400).json({ error: 'Invalid credentials.' });
    }

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
      dateOfBirth: user.dob,
      email: user.email,
      phoneNumber: user.phone,
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

// Forgot Password - Handle "Forgot Password" form submission
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by their email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Generate a password reset token
    const token = jwt.sign(
      {
        email: req.body.email,
        expiresIn: '1h',
      },
      process.env.JWT_SECRET
    );

    // Create a password reset URL that includes the generated token
    const resetPasswordURL = `https://plankton-app-e3b4u.ondigitalocean.app/reset-password/${token}`;

    // Send the password reset email to the user
    await sendEmail(
      user.email,
      'Password Reset Request',
      `Hi ${user.name},\n\nTo reset your password, click the link below:\n\n${resetPasswordURL}\n\nThe link is valid for 1 hour.\n\nYou may neglect this email if you did not make this request.`
    );

    return res.status(200).json({ message: 'Password reset email sent.' });
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// Password Reset - Handle "Password Reset" form submission
const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { password, passwordConfirmation } = req.body;
  try {
    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    // Find the user by their email
    const user = await User.findOne({
      email: decodedToken.email,
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const isStrongPassword = validatePasswordStrength(req.body.password);
    if (!isStrongPassword) {
      return res.status(400).json({ error: 'Password is not strong enough.' });
    }

    if (password !== passwordConfirmation) {
      return res.status(400).json({ error: 'Passwords do not match.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;

    // Save the updated user with the new password to the database
    await user.save();

    return res.status(200).json({ message: 'Password reset successful.' });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res
        .status(400)
        .json({ error: 'Password reset link has expired.' });
    }
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// User logout
const logout = (req, res) => {
  try {
    res.clearCookie('jwt');
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    // console.error('Error logging out user:', error);
    return res
      .status(500)
      .json({ error: 'An error occurred while logging out.' });
  }
};

module.exports = {
  signup,
  activateUser,
  login,
  logout,
  getUserProfile,
  updateUserProfile,
  connectGoogleAccount,
  forgotPassword,
  resetPassword,
};
