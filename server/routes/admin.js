// In server/routes/admin.js or similar
const express = require('express');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const Group = require('../models/Group');
const Message = require('../models/Message');
const User = require('../models/User');

const router = express.Router();

// Get room statistics
router.get('/room-stats', auth, admin, async (req, res) => {
  try {
    const groups = await Group.aggregate([
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'group',
          as: 'messages'
        }
      },
      {
        $project: {
          name: 1,
          description: 1,
          category: 1,
          memberCount: { $size: '$members' },
          messageCount: { $size: '$messages' },
          activityScore: {
            $add: [
              { $multiply: [{ $size: '$members' }, 1] },
              { $multiply: [{ $size: '$messages' }, 2] }
            ]
          }
        }
      },
      { $sort: { activityScore: -1 } }
    ]);
    
    res.json(groups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get message statistics
router.get('/message-stats', auth, admin, async (req, res) => {
  try {
    // Get today's date and start of week
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
    
    const messageStats = await Group.aggregate([
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'group',
          as: 'messages'
        }
      },
      {
        $project: {
          name: 1,
          totalMessages: { $size: '$messages' },
          today: {
            $size: {
              $filter: {
                input: '$messages',
                as: 'message',
                cond: { $gte: ['$$message.createdAt', startOfToday] }
              }
            }
          },
          thisWeek: {
            $size: {
              $filter: {
                input: '$messages',
                as: 'message',
                cond: { $gte: ['$$message.createdAt', startOfWeek] }
              }
            }
          }
        }
      },
      { $sort: { totalMessages: -1 } }
    ]);
    
    res.json(messageStats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get user activity
router.get('/user-activity', auth, admin, async (req, res) => {
  try {
    const userActivity = await User.aggregate([
      {
        $lookup: {
          from: 'messages',
          localField: '_id',
          foreignField: 'sender',
          as: 'messages'
        }
      },
      {
        $project: {
          username: 1,
          email: 1,
          messageCount: { $size: '$messages' },
          lastActive: {
            $max: '$messages.createdAt'
          },
          activityScore: {
            $add: [
              { $multiply: [{ $size: '$messages' }, 2] },
              { $cond: [{ $gt: ['$lastActive', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] }, 10, 0] }
            ]
          }
        }
      },
      { $sort: { activityScore: -1 } }
    ]);
    
    res.json(userActivity);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;