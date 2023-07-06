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

// GET /users/:id/profile
const getUserProfile = async (req, res) => {
  const { id } = req.params;

  try {
    // Find the user in the database
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Extract the relevant profile data
    const { name, email, ProfilePic, age } = user;

    // Return the user's profile
    return res.json({ name, email, ProfilePic, age });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { updateUserProfile, getUserProfile };
