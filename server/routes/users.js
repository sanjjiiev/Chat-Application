const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const User = require('../models/User');

const router = express.Router();

// Get pending users (admin only)
router.get('/pending', auth, admin, async (req, res) => {
  try {
    const users = await User.find({ isApproved: false })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Approve user (admin only)
router.patch('/:id/approve', auth, admin, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isApproved: true },
      { new: true }
    ).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users (admin only)
router.get('/', auth, admin, async (req, res) => {
  try {
    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;