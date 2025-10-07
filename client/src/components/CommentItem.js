import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './CommentItem.css';

const CommentItem = ({ comment, depth, onReply, onVote }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const { user } = useAuth();

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: replyContent,
          postId: comment.post,
          parentCommentId: comment._id
        })
      });

      if (response.ok) {
        setReplyContent('');
        setShowReplyForm(false);
        onReply(); // Refresh comments
      }
    } catch (error) {
      console.error('Error posting reply:', error);
    }
  };

  const handleVote = (type) => {
    onVote(comment._id, type);
  };

  const hasUpvoted = user && comment.upvotes.includes(user.id);
  const hasDownvoted = user && comment.downvotes.includes(user.id);

  return (
    <div className={`comment-item depth-${depth}`}>
      <div className="comment-content">
        <div className="comment-votes">
          <button 
            className={`upvote ${hasUpvoted ? 'active' : ''}`}
            onClick={() => handleVote('upvote')}
            aria-label="Upvote"
          >
            ▲
          </button>
          <span className="score">{comment.score}</span>
          <button 
            className={`downvote ${hasDownvoted ? 'active' : ''}`}
            onClick={() => handleVote('downvote')}
            aria-label="Downvote"
          >
            ▼
          </button>
        </div>
        
        <div className="comment-body">
          <div className="comment-header">
            <span className="comment-author">{comment.author.username}</span>
            <span className="comment-time">
              {new Date(comment.createdAt).toLocaleDateString()}
            </span>
          </div>
          
          <p className="comment-text">{comment.content}</p>
          
          <div className="comment-actions">
            {depth < 5 && (
              <button 
                onClick={() => setShowReplyForm(!showReplyForm)}
                className="reply-btn"
              >
                Reply
              </button>
            )}
            <span className="comment-points">{comment.score} points</span>
          </div>
          
          {showReplyForm && (
            <form onSubmit={handleSubmitReply} className="reply-form">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows="2"
              />
              <div className="button-group">
                <button type="submit" className="submit-reply">Reply</button>
                <button 
                  type="button" 
                  onClick={() => setShowReplyForm(false)}
                  className="cancel-reply"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
      
      {comment.replies && comment.replies.length > 0 && (
        <div className="comment-replies">
          {comment.replies.map(reply => (
            <CommentItem
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              onReply={onReply}
              onVote={onVote}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;