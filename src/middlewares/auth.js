const jwt = require('jsonwebtoken');
const User = require('../models/Users');

const isAuthorized = async (req, res, next) => {
  const token = req.cookies.jwt;

  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // eslint-disable-next-line no-underscore-dangle
    const user = await User.findById(decoded._id);
    if (!user) {
      return res.status(401).json({ msg: 'User not found.' });
    }

    req.user = user;
    return next();
  } catch (err) {
    return res.status(401).json({ msg: 'Token is not valid.' });
  }
};

module.exports = isAuthorized;
