const User = require('../models/Users');
const session = require('express-session');


const logout = (req, res) => {
    req.session.destroy(err => {
      if (err) {
        res.status(500).json({ error: 'Logout failed' });
      }
      res.redirect('/login');
    });
  };

  

  module.exports = {
    logout
  };
  