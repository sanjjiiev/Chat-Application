import React from 'react';
import PostItem from './PostItem';

const PostList = ({ posts, onVote, onComment }) => {
  return (
    <div className="post-list">
      {posts.map(post => (
        <PostItem
          key={post._id}
          post={post}
          onVote={onVote}
          onComment={onComment}
        />
      ))}
    </div>
  );
};

export default PostList;