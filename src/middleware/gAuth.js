const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findById(id)
    .then(user => {
      done(null, user);
    });
});

passport.use(
  new GoogleStrategy({
    clientID: process.env.GAPP_CLIENT_ID,
    clientSecret: process.env.GAPP_CLIENT_SECRET,
    callbackURL: '/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleAccountId: profile.id });
      
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          googleAccountId: profile.id,
          profilePic: profile.photos[0].value,
        });
        await user.save();
      }

      done(null, user);
    } catch (err) {
      done(err, null);
    }
  })
);

module.exports = passport;