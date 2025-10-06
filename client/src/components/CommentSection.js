import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CommentItem from './CommentItem';

const CommentSection = ({ postId }) => {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/post/${postId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const commentsData = await response.json();
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newComment,
          postId: postId
        })
      });

      if (response.ok) {
        await fetchComments(); // Refresh comments
        setNewComment('');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    }
  };

  const handleCommentVote = async (commentId, type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/comments/${commentId}/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedComment = await response.json();
        
        // Update the comment in the nested structure
        const updateCommentInTree = (comments, commentId, updatedFields) => {
          return comments.map(comment => {
            if (comment._id === commentId) {
              return { ...comment, ...updatedFields };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentInTree(comment.replies, commentId, updatedFields)
              };
            }
            return comment;
          });
        };

        setComments(prevComments => 
          updateCommentInTree(prevComments, commentId, {
            upvotes: updatedComment.upvotes,
            downvotes: updatedComment.downvotes,
            score: updatedComment.score
          })
        );
      }
    } catch (error) {
      console.error('Error voting on comment:', error);
    }
  };

  const renderComments = (comments, depth = 0) => {
    return comments.map(comment => (
      <CommentItem
        key={comment._id}
        comment={comment}
        depth={depth}
        onReply={fetchComments}
        onVote={handleCommentVote}
      />
    ));
  };

  return (
    <div className="comment-section">
      <form onSubmit={handleSubmitComment} className="comment-form">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="What are your thoughts?"
          rows="3"
        />
        <button type="submit">Comment</button>
      </form>
      
      <div className="comments-list">
        {renderComments(comments)}
      </div>
    </div>
  );
};

export default CommentSection;