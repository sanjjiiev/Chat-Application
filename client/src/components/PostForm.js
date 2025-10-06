import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const PostForm = ({ onPostCreated }) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [media, setMedia] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      if (media) {
        formData.append('media', media);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/posts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
          // Don't set Content-Type when using FormData - let the browser set it
        },
        body: formData
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create post');
      }

      onPostCreated(data);
      setTitle('');
      setContent('');
      setMedia(null);
      // Reset file input
      document.getElementById('media-upload').value = '';
    } catch (error) {
      console.error('Error creating post:', error);
      setError(error.message);
    }
    setIsSubmitting(false);
  };

  const handleMediaChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError('File size must be less than 50MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        setError('Please select an image or video file');
        return;
      }
      
      setMedia(file);
      setError('');
    }
  };

  return (
    <div className="post-form card">
      <h3>Create Post</h3>
      {error && <div className="error-message">{error}</div>}
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Post title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Post content (optional)"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows="3"
        />
        <input
          id="media-upload"
          type="file"
          accept="image/*,video/*"
          onChange={handleMediaChange}
        />
        {media && (
          <div className="file-preview">
            <small>Selected: {media.name}</small>
          </div>
        )}
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Posting...' : 'Create Post'}
        </button>
      </form>
    </div>
  );
};

export default PostForm;