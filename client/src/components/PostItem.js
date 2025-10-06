import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import CommentSection from './CommentSection';

const PostItem = ({ post, onVote, onComment }) => {
  const [showComments, setShowComments] = useState(false);
  const { user } = useAuth();

  const handleVote = async (type) => {
    onVote(post._id, type);
  };

  const hasUpvoted = user && post.upvotes.includes(user.id);
  const hasDownvoted = user && post.downvotes.includes(user.id);

  return (
    <div className="post-item card">
      <div className="post-votes">
        <button 
          className={`upvote ${hasUpvoted ? 'active' : ''}`}
          onClick={() => handleVote('upvote')}
        >
          ▲
        </button>
        <span className="score">{post.score}</span>
        <button 
          className={`downvote ${hasDownvoted ? 'active' : ''}`}
          onClick={() => handleVote('downvote')}
        >
          ▼
        </button>
      </div>
      
      <div className="post-content">
        <h4>{post.title}</h4>
        {post.content && <p>{post.content}</p>}
        
        {post.media && post.mediaType === 'image' && (
          <img src={post.media} alt="Post media" className="post-media" />
        )}
        
        {post.media && post.mediaType === 'video' && (
          <video controls className="post-media">
            <source src={post.media} type="video/mp4" />
          </video>
        )}
        
        <div className="post-meta">
          <span>Posted by {post.author.username}</span>
          <span>{new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        
        <div className="post-actions">
          <button onClick={() => setShowComments(!showComments)}>
            💬 Comments
          </button>
        </div>
        
        {showComments && (
          <CommentSection postId={post._id} />
        )}
      </div>
    </div>
  );
};

export default PostItem;