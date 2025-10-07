import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GroupList from '../components/GroupList';
import ChatWindow from '../components/ChatWindow';
import PostForm from '../components/PostForm';
import PostList from '../components/PostList';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('chat');
  const [darkMode, setDarkMode] = useState(false); // <-- Dark mode state
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    fetchGroups();
    fetchPosts();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/groups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        setLoading(false);
        return;
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        setGroups(data);
      } else if (data && data.groups && Array.isArray(data.groups)) {
        setGroups(data.groups);
      } else if (data && data.data && Array.isArray(data.data)) {
        setGroups(data.data);
      } else {
        console.error('Unexpected API response format:', data);
        setError('Unexpected response format from server');
        setGroups([]);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
      setError('Failed to fetch groups');
      setGroups([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPosts = async () => {
    try {
      setPostsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/posts', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const postsData = await response.json();
        setPosts(postsData);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setPostsLoading(false);
    }
  };

  const handlePostCreated = (newPost) => {
    setPosts([newPost, ...posts]);
  };

  const handleVote = async (postId, type) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/posts/${postId}/${type}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const updatedPost = await response.json();
        setPosts(posts.map(post => 
          post._id === postId ? updatedPost : post
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const retryFetchGroups = () => {
    fetchGroups();
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`dashboard ${darkMode ? 'dark-mode' : ''}`}> {/* Apply dark-mode class */}
      <header className="dashboard-header">
        <h1>College Chat App</h1>
        <div className="user-info">
          <span>Welcome, {currentUser.username}</span>
          <a href="/profile" className="profile-link">Profile</a>
          {currentUser.isAdmin && (
            <a href="/admin" className="admin-link">Admin Panel</a>
          )}
          <button onClick={handleLogout}>Logout</button>
          {/* Dark Mode Toggle Button */}
          <button onClick={toggleDarkMode} className="dark-mode-toggle">
            {darkMode ? 'Light Mode' : 'Dark Mode'}
          </button>
        </div>
      </header>

      <div className="dashboard-tabs">
        <button 
          className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          💬 Group Chat
        </button>
        <button 
          className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => setActiveTab('posts')}
        >
          📝 Community Posts
        </button>
      </div>

      <div className="dashboard-content">
        {loading ? (
          <div className="loading">Loading groups...</div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={retryFetchGroups}>Retry</button>
          </div>
        ) : (
          <>
            <GroupList 
              groups={groups} 
              selectedGroup={selectedGroup}
              onSelectGroup={setSelectedGroup}
            />

            <div className="main-content">
              {activeTab === 'chat' && (
                <div className="chat-window-container">
                  {selectedGroup ? (
                    <>
                      <div className="chat-header">
                        <h3>{selectedGroup.name}</h3>
                        <p style={{color: 'var(--text-secondary)', fontSize: '0.8rem', margin: '0.2rem 0 0 0'}}>
                          {selectedGroup.description}
                        </p>
                      </div>
                      <ChatWindow group={selectedGroup} />
                    </>
                  ) : (
                    <div className="no-group-selected">
                      <div className="icon">💬</div>
                      <h3>No Group Selected</h3>
                      <p>Choose a group from the sidebar to start chatting</p>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'posts' && (
                <div className="posts-container">
                  <PostForm onPostCreated={handlePostCreated} />
                  {postsLoading ? (
                    <div className="loading">Loading posts...</div>
                  ) : (
                    <PostList 
                      posts={posts} 
                      onVote={handleVote}
                      currentUserId={currentUser._id || currentUser.id}
                    />
                  )}
                  {posts.length === 0 && !postsLoading && (
                    <div className="no-posts">
                      <p>No posts yet. Be the first to share something!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
