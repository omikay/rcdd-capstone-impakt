const User = require('../models/Users');

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

module.exports = { updateUserProfile };
