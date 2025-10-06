const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: false
  },
  media: {
    type: String, // URL for photo/video
    required: false
  },
  mediaType: {
    type: String,
    enum: ['image', 'video', 'none'],
    default: 'none'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: []
  }],
  score: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Ensure arrays are initialized
postSchema.pre('save', function(next) {
  if (!this.upvotes) this.upvotes = [];
  if (!this.downvotes) this.downvotes = [];
  next();
});

module.exports = mongoose.model('Post', postSchema);