import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';
import {
  PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [userPosts, setUserPosts] = useState([]);
  const [userComments, setUserComments] = useState([]);
  const [karma, setKarma] = useState({ totalKarma: 0, postKarma: 0, commentKarma: 0 });
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    displayName: '',
    age: '',
    bio: '',
    location: '',
    website: '',
    profilePhoto: null
  });

  useEffect(() => {
    fetchProfileData();
    calculateKarma();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const [profileRes, postsRes, commentsRes] = await Promise.all([
        fetch('/api/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/profile/posts', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch('/api/profile/comments', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (profileRes.ok) {
        const profileData = await profileRes.json();
        setProfile(profileData);
        setFormData({
          displayName: profileData.displayName || '',
          age: profileData.age || '',
          bio: profileData.bio || '',
          location: profileData.location || '',
          website: profileData.website || '',
          profilePhoto: null
        });
      }

      if (postsRes.ok) {
        const postsData = await postsRes.json();
        setUserPosts(postsData);
      }

      if (commentsRes.ok) {
        const commentsData = await commentsRes.json();
        setUserComments(commentsData);
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const calculateKarma = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/karma', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const karmaData = await response.json();
        setKarma(karmaData);
      }
    } catch (error) {
      console.error('Error calculating karma:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      profilePhoto: e.target.files[0]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const submitData = new FormData();
      
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });

      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: submitData
      });

      const data = await response.json();

      if (response.ok) {
        setProfile(data);
        setIsEditing(false);
        setSuccess('Profile updated successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setFormData({
      displayName: profile.displayName || '',
      age: profile.age || '',
      bio: profile.bio || '',
      location: profile.location || '',
      website: profile.website || '',
      profilePhoto: null
    });
    setIsEditing(false);
    setError('');
  };

  const formatJoinDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }
  

// Inside your component, before return()
const karmaData = [
  { name: 'Post Karma', value: karma.postKarma },
  { name: 'Comment Karma', value: karma.commentKarma }
];
const COLORS = ['#0088FE', '#00C49F'];

// Prepare posts/comments activity per day
const activityData = [];
const allDates = [...userPosts.map(p => p.createdAt), ...userComments.map(c => c.createdAt)];
const dateMap = {};

allDates.forEach(date => {
  const day = new Date(date).toLocaleDateString();
  dateMap[day] = dateMap[day] || { posts: 0, comments: 0 };
});

userPosts.forEach(p => {
  const day = new Date(p.createdAt).toLocaleDateString();
  dateMap[day].posts += 1;
});

userComments.forEach(c => {
  const day = new Date(c.createdAt).toLocaleDateString();
  dateMap[day].comments += 1;
});

for (const day in dateMap) {
  activityData.push({ date: day, posts: dateMap[day].posts, comments: dateMap[day].comments });
}


  return (
    <div className="profile-page">
      <div className="profile-header">
        <button 
          className="back-button"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h1>User Profile</h1>
      </div>

      <div className="profile-content">
        {/* Sidebar */}
        <div className="profile-sidebar">
          <div className="profile-card">
            <div className="profile-photo-section">
              {isEditing ? (
                <div className="photo-upload">
                  <div className="current-photo">
                    <img 
                      src={formData.profilePhoto ? URL.createObjectURL(formData.profilePhoto) : (profile.profilePhoto || '/default-avatar.png')} 
                      alt="Profile" 
                    />
                  </div>
                  <input
                type="file"
                id="profilePhoto"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profilePhoto" className="upload-label">
                  Change Photo
                </label>

                </div>
              ) : (
                <div className="profile-photo">
                  <img 
                    src={profile.profilePhoto || '/default-avatar.png'} 
                    alt="Profile" 
                  />
                </div>
              )}
            </div>

            <div className="profile-info">
              {isEditing ? (
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Display Name"
                  className="edit-input"
                />
              ) : (
                <h2>{profile.displayName || profile.username}</h2>
              )}
              
              <p className="username">u/{profile.username}</p>
              
              <div className="karma-badge">
                <span className="karma-count">{karma.totalKarma}</span>
                <span className="karma-label">Karma</span>
              </div>

              <div className="join-date">
                <span>Joined {formatJoinDate(profile.joinDate)}</span>
              </div>
            </div>

            {!isEditing && (
              <button 
                className="edit-profile-btn"
                onClick={() => setIsEditing(true)}
              >
                Edit Profile
              </button>
            )}
          </div>

          <div className="stats-card">
            <h3>Stats</h3>
            <div className="stat-item">
              <span className="stat-label">Post Karma</span>
              <span className="stat-value">{karma.postKarma}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Comment Karma</span>
              <span className="stat-value">{karma.commentKarma}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Posts</span>
              <span className="stat-value">{userPosts.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Comments</span>
              <span className="stat-value">{userComments.length}</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="profile-main">
          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          {isEditing ? (
            <div className="edit-profile-form">
              <h2>Edit Profile</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Display Name</label>
                  <input
                    type="text"
                    name="displayName"
                    value={formData.displayName}
                    onChange={handleInputChange}
                    placeholder="How you want to be called"
                  />
                </div>

                <div className="form-group">
                  <label>Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleInputChange}
                    placeholder="Your age"
                    min="13"
                    max="120"
                  />
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleInputChange}
                    placeholder="Tell us about yourself"
                    rows="4"
                    maxLength="500"
                  />
                  <div className="char-count">{formData.bio.length}/500</div>
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Where you're from"
                  />
                </div>

                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    onClick={handleCancelEdit}
                    className="cancel-btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={saving}
                    className="save-btn"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <>
              <div className="profile-tabs">
                <button 
                  className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  Overview
                </button>
                <button 
                  className={`tab-button ${activeTab === 'posts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('posts')}
                >
                  Posts
                </button>
                <button 
                  className={`tab-button ${activeTab === 'comments' ? 'active' : ''}`}
                  onClick={() => setActiveTab('comments')}
                >
                  Comments
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'overview' && (
                  <div className="overview-tab">
                    <div className="bio-section">
                      <h3>About</h3>
                      {profile.bio ? (
                        <p>{profile.bio}</p>
                      ) : (
                        <p className="no-bio">No bio yet.</p>
                      )}
                      
                      <div className="additional-info">
                        {profile.age && (
                          <div className="info-item">
                            <strong>Age:</strong> {profile.age}
                          </div>
                        )}
                        {profile.location && (
                          <div className="info-item">
                            <strong>Location:</strong> {profile.location}
                          </div>
                        )}
                        {profile.website && (
                          <div className="info-item">
                            <strong>Website:</strong> 
                            <a href={profile.website} target="_blank" rel="noopener noreferrer">
                              {profile.website}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="recent-activity">
                      <h3>Recent Activity</h3>
                      <div className="activity-list">
                        {userPosts.slice(0, 5).map(post => (
                          <div key={post._id} className="activity-item">
                            <span className="activity-type">Posted:</span>
                            <span className="activity-content">{post.title}</span>
                            <span className="activity-meta">
                              {new Date(post.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))}
                        {userPosts.length === 0 && (
                          <p className="no-activity">No recent activity.</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'posts' && (
                  <div className="posts-tab">
                    <h3>Your Posts</h3>
                    {userPosts.length > 0 ? (
                      userPosts.map(post => (
                        <div key={post._id} className="profile-post">
                          <div className="post-score">
                            <span>{post.score}</span>
                          </div>
                          <div className="post-content">
                            <h4>{post.title}</h4>
                            <p>{post.content}</p>
                            <div className="post-meta">
                              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                              <span>{post.upvotes.length} upvotes</span>
                              <span>{post.downvotes.length} downvotes</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-posts">You haven't created any posts yet.</p>
                    )}
                  </div>
                )}

                {activeTab === 'comments' && (
                  <div className="comments-tab">
                    <h3>Your Comments</h3>
                    {userComments.length > 0 ? (
                      userComments.map(comment => (
                        <div key={comment._id} className="profile-comment">
                          <div className="comment-score">
                            <span>{comment.score}</span>
                          </div>
                          <div className="comment-content">
                            <p>{comment.content}</p>
                            <div className="comment-meta">
                              <span>On: {comment.post?.title || 'Post'}</span>
                              <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="no-comments">You haven't posted any comments yet.</p>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="profile-visualization">
  <h2>Visualizations</h2>

  <div className="charts-container">
    {/* Karma Pie Chart */}
    <div className="chart-card">
      <h3>Karma Breakdown</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie data={karmaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
            {karmaData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>

    {/* Posts & Comments Bar Chart */}
    <div className="chart-card">
      <h3>Posts & Comments Activity</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={activityData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="posts" fill="#8884d8" />
          <Bar dataKey="comments" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>

    </div>
  );
};

export default Profile;