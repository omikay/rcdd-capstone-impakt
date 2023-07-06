const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/Users');
const sendEmail = require('../middleware/email');

// User signup
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

    await sendEmail(user.email, 'Welcome to Impakt!', `Dear ${user.name}, your Impakt account has been created successfully.`);

    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    // const token = jwt.sign(
    //   {
    //     name: user.name,
    //     email: user.email,
    //     providerId: `google-${user.id}`,
    //     exp: Math.floor(Date.now() / 1000) + 1209600, // 14 days expiration
    //     iat: Math.floor(Date.now() / 1000), // Issued at date
    //     avatar: user.avatar,
    //   },
    //   process.env.JWT_SECRET
    // );
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.cookie('jwt', token, { httpOnly: true });

    // Send token in the response
    // res.status(201).json({ token });

    res.redirect('/dashboard');    
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ error: 'Internal server error' });
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

module.exports = { updateUserProfile, singup};
