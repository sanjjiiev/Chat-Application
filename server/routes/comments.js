const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Comment = require('../models/Comment');
const Post = require('../models/Post');

// Create a new comment
router.post('/', auth, async (req, res) => {
  try {
    const { content, postId, parentCommentId } = req.body;
    
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    let depth = 0;
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId);
      depth = parentComment.depth + 1;
    }

    const comment = new Comment({
      content,
      author: req.user.id,
      post: postId,
      parentComment: parentCommentId || null,
      depth
    });

    await comment.save();
    await comment.populate('author', 'username');

    // Add to parent comment's replies if it's a reply
    if (parentCommentId) {
      await Comment.findByIdAndUpdate(
        parentCommentId,
        { $push: { replies: comment._id } }
      );
    }

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comments for a post
router.get('/post/:postId', auth, async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.postId })
      .populate('author', 'username')
      .sort({ createdAt: 1 });
    
    // Build nested comment structure
    const buildCommentTree = (comments, parentId = null) => {
      return comments
        .filter(comment => 
          (parentId === null && comment.parentComment === null) ||
          (parentId && comment.parentComment && comment.parentComment.toString() === parentId)
        )
        .map(comment => ({
          ...comment.toObject(),
          replies: buildCommentTree(comments, comment._id.toString())
        }));
    };

    const commentTree = buildCommentTree(comments);
    res.json(commentTree);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upvote a comment
router.post('/:id/upvote', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.downvotes = comment.downvotes.filter(
      userId => userId.toString() !== req.user.id
    );
    
    if (!comment.upvotes.includes(req.user.id)) {
      comment.upvotes.push(req.user.id);
    } else {
      comment.upvotes = comment.upvotes.filter(
        userId => userId.toString() !== req.user.id
      );
    }
    
    comment.score = comment.upvotes.length - comment.downvotes.length;
    await comment.save();
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Downvote a comment
router.post('/:id/downvote', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    comment.upvotes = comment.upvotes.filter(
      userId => userId.toString() !== req.user.id
    );
    
    if (!comment.downvotes.includes(req.user.id)) {
      comment.downvotes.push(req.user.id);
    } else {
      comment.downvotes = comment.downvotes.filter(
        userId => userId.toString() !== req.user.id
      );
    }
    
    comment.score = comment.upvotes.length - comment.downvotes.length;
    await comment.save();
    
    res.json(comment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;