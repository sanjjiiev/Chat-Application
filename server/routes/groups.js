const express = require('express');
const auth = require('../middleware/auth');
const Group = require('../models/Group');
const Message = require('../models/Message');

const router = express.Router();

// Get all groups
router.get('/', auth, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('admin', 'username')
      .populate('members', 'username');
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Join a group
router.post('/:id/join', auth, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }
    
    // Check if user is already a member
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ message: 'Already a member of this group' });
    }
    
    group.members.push(req.user.id);
    await group.save();
    
    res.json({ message: 'Joined group successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get group messages
router.get('/:id/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({ 
      group: req.params.id,
      isDeleted: false 
    })
      .populate('sender', 'username')
      .sort({ createdAt: 1 });
    
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;