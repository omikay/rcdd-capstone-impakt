const User = require('../models/Users');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require("../utils/email");

exports.getSignup = (req, res, next) => {
  // Display signup page
  res.render('signup');
};

exports.postSignup = async (req, res, next) => {
  const { name, email, password, passwordConfirmation, idToken } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    return res.status(400).send('User with this email already exists.');
  }

  if (idToken) {
    // If an ID token is provided, this is a signup through Google.
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const { name, email, picture } = ticket.getPayload();

    user = new User({
      name,
      email,
      profilePic: picture,
      googleAccountId: ticket.getUserId(),
    });
  } else {
    // If no ID token is provided, this is a signup with email and password.
    if (password !== passwordConfirmation) {
      return res.status(400).send('Passwords do not match.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    user = new User({
      name,
      email,
      password: hashedPassword,
    });
  }

  await user.save();

  // After the user is created, send a confirmation email
  await sendEmail(
    user.email, 
    subject = 'Welcome to Impakt!', 
    text = 'You have successfully signed up for an Impakt account with your Google account.'
  );

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
  res.cookie('jwt', token, { httpOnly: true });

  res.redirect('/dashboard');
};

