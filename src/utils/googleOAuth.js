const passport = require('passport');
const jwt = require('jsonwebtoken');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/Users');
const sendEmail = require('./email');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error, null);
    });
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GAPP_CLIENT_ID,
      clientSecret: process.env.GAPP_CLIENT_SECRET,
      callbackURL: '/api/auth/google/callback',
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const existingUser = await User.findOne({ googleId: profile.id });

        if (existingUser) {
          const token = jwt.sign(
            {
              name: existingUser.name,
              email: existingUser.email,
              exp: Math.floor(Date.now() / 1000) + 1209600, // 14 days expiration
              iat: Math.floor(Date.now() / 1000), // Issued at date
            },
            process.env.JWT_SECRET
          );

          return done(null, { user: existingUser, token });
        }

        const newUser = await new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleAccountId: profile.id,
          profilePic: profile.photos[0].value,
        }).save();

        await sendEmail(
          newUser.email,
          'Welcome to Impakt!',
          `Dear ${newUser.name}, your Impakt account has been created successfully.`
        );

        const token = jwt.sign(
          {
            name: newUser.name,
            email: newUser.email,
            exp: Math.floor(Date.now() / 1000) + 1209600, // 14 days expiration
            iat: Math.floor(Date.now() / 1000), // Issued at date
          },
          process.env.JWT_SECRET
        );

        return done(null, { user: newUser, token });
      } catch (error) {
        console.error('Error with Google OAuth:', error);
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
