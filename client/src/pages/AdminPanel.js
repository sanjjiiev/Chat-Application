import React, { useState, useEffect, useCallback } from 'react';
import './AdminPanel.css';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';


const AdminPanel = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [roomStats, setRoomStats] = useState([]);
  const [messageStats, setMessageStats] = useState([]);
  const [userActivity, setUserActivity] = useState([]);
  const [postStats, setPostStats] = useState([]);


  const getAuthToken = useCallback(() => {
    return localStorage.getItem('token');
  }, []);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/users/pending', {
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
      const usersData = Array.isArray(data) ? data : data.users || data.data || [];
      setPendingUsers(usersData);
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  const fetchAllUsers = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      const data = await response.json();
      const usersData = Array.isArray(data) ? data : data.users || data.data || [];
      setAllUsers(usersData);
    } catch (error) {
      console.error('Error fetching all users:', error);
      setAllUsers([]);
    }
  }, [getAuthToken]);
  const fetchPostStats = useCallback(async () => {
  try {
    const token = getAuthToken();
    if (!token) {
      setError('No authentication token found. Please log in again.');
      return;
    }

    const response = await fetch('/api/admin/post-stats', {  // we’ll create this route
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (response.status === 401) {
      setError('Authentication failed. Please log in again.');
      return;
    }

    const data = await response.json();
    setPostStats(Array.isArray(data) ? data : data.posts || data.data || []);
  } catch (error) {
    console.error('Error fetching post stats:', error);
    setPostStats([]);
  }
}, [getAuthToken]);


  const fetchRoomStats = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch('/api/admin/room-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      const data = await response.json();
      const statsData = Array.isArray(data) ? data : data.stats || data.data || [];
      setRoomStats(statsData);
    } catch (error) {
      console.error('Error fetching room stats:', error);
      setRoomStats([]);
    }
  }, [getAuthToken]);

  const fetchMessageStats = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch('/api/admin/message-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      const data = await response.json();
      const statsData = Array.isArray(data) ? data : data.stats || data.data || [];
      setMessageStats(statsData);
    } catch (error) {
      console.error('Error fetching message stats:', error);
      setMessageStats([]);
    }
  }, [getAuthToken]);

  const fetchUserActivity = useCallback(async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch('/api/admin/user-activity', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
        return;
      }

      const data = await response.json();
      const activityData = Array.isArray(data) ? data : data.activity || data.data || [];
      setUserActivity(activityData);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      setUserActivity([]);
    }
  }, [getAuthToken]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchPendingUsers();
      fetchAllUsers();
    } else if (activeTab === 'rooms') {
      fetchRoomStats();
    } else if (activeTab === 'messages') {
      fetchMessageStats();
    } else if (activeTab === 'activity') {
      fetchUserActivity();
    }else if (activeTab === 'posts') {
    fetchPostStats();
  }
  }, [activeTab, fetchPendingUsers, fetchAllUsers, fetchRoomStats, fetchMessageStats, fetchUserActivity,fetchPostStats]);

  const approveUser = async (userId) => {
    try {
      const token = getAuthToken();
      if (!token) {
        setError('No authentication token found. Please log in again.');
        return;
      }

      const response = await fetch(`/api/users/${userId}/approve`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setPendingUsers(pendingUsers.filter(user => user._id !== userId));
        fetchAllUsers(); // Re-fetch all users to update the list
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        console.error('Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  if (loading && activeTab === 'users') {
    return <div className="admin-panel">Loading...</div>;
  }

  if (error) {
    return (
      <div className="admin-panel">
        <h1>Admin Panel</h1>
        <div className="error-message">{error}</div>
        <button onClick={() => window.location.href = '/login'}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="admin-panel">
      <h1>Admin Panel</h1>
      <div className="admin-tabs">
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          User Management
        </button>
        <button
          className={activeTab === 'rooms' ? 'active' : ''}
          onClick={() => setActiveTab('rooms')}
        >
          Room Statistics
        </button>
        <button
          className={activeTab === 'messages' ? 'active' : ''}
          onClick={() => setActiveTab('messages')}
        >
          Message Statistics
        </button>
        <button
          className={activeTab === 'activity' ? 'active' : ''}
          onClick={() => setActiveTab('activity')}
        >
          User Activity
        </button>
        <button
  className={activeTab === 'posts' ? 'active' : ''}
  onClick={() => setActiveTab('posts')}
>
  Posts Statistics
</button>

      </div>

      {activeTab === 'users' && (
        <>
          <div className="pending-users">
            <h2>Pending Approval</h2>
            {!Array.isArray(pendingUsers) || pendingUsers.length === 0 ? (
              <p>No users pending approval</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          onClick={() => approveUser(user._id)}
                          className="approve-btn"
                        >
                          Approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="all-users">
            <h2>All Users</h2>
            {!Array.isArray(allUsers) || allUsers.length === 0 ? (
              <p>No users found</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {allUsers.map(user => (
                    <tr key={user._id}>
                      <td>{user.username}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`status ${user.isApproved ? 'approved' : 'pending'}`}>
                          {user.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td>{user.isAdmin ? 'Admin' : 'User'}</td>
                      <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === 'rooms' && (
        <div className="room-stats">
          <h2>Room Statistics</h2>
          {!Array.isArray(roomStats) || roomStats.length === 0 ? (
            <p>No room statistics available</p>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Room Participation</h3>
                  <div className="chart-container">
<BarChart
                width={500}
                height={300}
                data={roomStats.slice(0, 5).map(room => ({
                  name: room.name,
                  members: room.memberCount,
                  messages: room.messageCount
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="members" fill="#8884d8" name="Members" />
                <Bar dataKey="messages" fill="#82ca9d" name="Messages" />
              </BarChart>
                  </div>
                </div>
                <div className="stat-card">
                  <h3>Most Active Rooms</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Room Name</th>
                        <th>Members</th>
                        <th>Messages</th>
                        <th>Activity Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomStats.slice(0, 5).map(room => (
                        <tr key={room._id}>
                          <td>{room.name}</td>
                          <td>{room.memberCount}</td>
                          <td>{room.messageCount}</td>
                          <td>{room.activityScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Room Membership Distribution</h3>
                  <div className="chart-container">
                    {/* Pie Chart for Membership Distribution */}
              <PieChart width={400} height={400}>
                <Pie
                  data={roomStats.map(room => ({ name: room.name, value: room.memberCount }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  label
                >
                  {roomStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'messages' && (
        <div className="message-stats">
          <h2>Message Statistics</h2>
          {!Array.isArray(messageStats) || messageStats.length === 0 ? (
            <p>No message statistics available</p>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Message Volume</h3>
                  <div className="chart-container">
                <ResponsiveContainer width="100%" height={300}>
                <BarChart data={messageStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="roomName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="totalMessages" fill="#8884d8" name="Total Messages" />
                  <Bar dataKey="today" fill="#82ca9d" name="Today" />
                  <Bar dataKey="thisWeek" fill="#ffc658" name="This Week" />
                </BarChart>
              </ResponsiveContainer>
                  </div>
                </div>
                <div className="stat-card">
                  <h3>Message Stats by Room</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Room Name</th>
                        <th>Total Messages</th>
                        <th>Today</th>
                        <th>This Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {messageStats.map(stat => (
                        <tr key={stat.roomId}>
                          <td>{stat.roomName}</td>
                          <td>{stat.totalMessages}</td>
                          <td>{stat.today}</td>
                          <td>{stat.thisWeek}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="user-activity">
          <h2>User Activity</h2>
          {!Array.isArray(userActivity) || userActivity.length === 0 ? (
            <p>No user activity data available</p>
          ) : (
            <>
              <div className="stats-grid">
                <div className="stat-card">
                  <h3>Most Active Users</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Username</th>
                        <th>Messages Sent</th>
                        <th>Last Active</th>
                        <th>Activity Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userActivity.slice(0, 10).map(user => (
                        <tr key={user._id}>
                          <td>{user.username}</td>
                          <td>{user.messageCount}</td>
                          <td>{new Date(user.lastActive).toLocaleDateString()}</td>
                          <td>{user.activityScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
      {activeTab === 'posts' && (
  <div className="post-stats">
    <h2>Posts Statistics</h2>
    {!Array.isArray(postStats) || postStats.length === 0 ? (
      <p>No post data available</p>
    ) : (
      <>
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Top Posts by Score</h3>
            <BarChart width={500} height={300} data={postStats.slice(0, 5)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="title" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="score" fill="#8884d8" name="Score" />
            </BarChart>
          </div>

          <div className="stat-card">
            <h3>Media Type Distribution</h3>
            <PieChart width={400} height={400}>
              <Pie
                data={[
                  { name: 'Images', value: postStats.filter(p => p.mediaType === 'image').length },
                  { name: 'Videos', value: postStats.filter(p => p.mediaType === 'video').length },
                  { name: 'None', value: postStats.filter(p => p.mediaType === 'none').length }
                ]}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#82ca9d"
                label
              >
                {['#0088FE', '#00C49F', '#FFBB28'].map((color, index) => (
                  <Cell key={index} fill={color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <h3>Posts per User</h3>
            <BarChart width={500} height={300} data={postStats.reduce((acc, post) => {
              const user = acc.find(u => u.username === post.author.username);
              if (user) user.count += 1;
              else acc.push({ username: post.author.username, count: 1 });
              return acc;
            }, [])}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="username" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#FF8042" name="Posts" />
            </BarChart>
          </div>
        </div>
      </>
    )}
  </div>
)}

    </div>
  );
};

export default AdminPanel;