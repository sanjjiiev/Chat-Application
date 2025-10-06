const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const User = require('../models/User');

// Get user profile
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user profile
router.put('/', auth, upload.single('profilePhoto'), async (req, res) => {
  try {
    const {
      displayName,
      age,
      bio,
      location,
      website
    } = req.body;

    const updateFields = {};
    
    if (displayName !== undefined) updateFields.displayName = displayName;
    if (age !== undefined) updateFields.age = age;
    if (bio !== undefined) updateFields.bio = bio;
    if (location !== undefined) updateFields.location = location;
    if (website !== undefined) updateFields.website = website;

    // Handle profile photo upload
    if (req.file) {
      updateFields.profilePhoto = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');

    res.json(user);
  } catch (error) {
    console.error('Error updating profile:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's posts for profile
router.get('/posts', auth, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const posts = await Post.find({ author: req.user.id })
      .populate('author', 'username profilePhoto displayName')
      .sort({ createdAt: -1 });
    
    res.json(posts);
  } catch (error) {
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's comments for profile
router.get('/comments', auth, async (req, res) => {
  try {
    const Comment = require('../models/Comment');
    const comments = await Comment.find({ author: req.user.id })
      .populate('post', 'title')
      .sort({ createdAt: -1 })
      .limit(20);
    
    res.json(comments);
  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Calculate user karma (upvotes - downvotes on posts and comments)
router.get('/karma', auth, async (req, res) => {
  try {
    const Post = require('../models/Post');
    const Comment = require('../models/Comment');
    
    const userPosts = await Post.find({ author: req.user.id });
    const userComments = await Comment.find({ author: req.user.id });
    
    let postKarma = 0;
    let commentKarma = 0;
    
    userPosts.forEach(post => {
      postKarma += (post.upvotes.length - post.downvotes.length);
    });
    
    userComments.forEach(comment => {
      commentKarma += (comment.upvotes.length - comment.downvotes.length);
    });
    
    const totalKarma = postKarma + commentKarma;
    
    // Update user's karma in database
    await User.findByIdAndUpdate(req.user.id, { karma: totalKarma });
    
    res.json({ totalKarma, postKarma, commentKarma });
  } catch (error) {
    console.error('Error calculating karma:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;