import React, { useState, useEffect, useCallback } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get token from localStorage
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
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setPendingUsers(data);
      } else if (data && data.users && Array.isArray(data.users)) {
        setPendingUsers(data.users);
      } else if (data && data.data && Array.isArray(data.data)) {
        setPendingUsers(data.data);
      } else {
        console.error('Unexpected API response format:', data);
        setPendingUsers([]);
        setError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      setPendingUsers([]);
      setError('Failed to fetch pending users');
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
      
      // Ensure data is an array
      if (Array.isArray(data)) {
        setAllUsers(data);
      } else if (data && data.users && Array.isArray(data.users)) {
        setAllUsers(data.users);
      } else if (data && data.data && Array.isArray(data.data)) {
        setAllUsers(data.data);
      } else {
        console.error('Unexpected API response format:', data);
        setAllUsers([]);
        setError('Unexpected response format from server');
      }
    } catch (error) {
      console.error('Error fetching all users:', error);
      setAllUsers([]);
      setError('Failed to fetch all users');
    }
  }, [getAuthToken]);

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
        // Filter out the approved user
        setPendingUsers(pendingUsers.filter(user => user._id !== userId));
        // Refresh all users to see the updated status
        fetchAllUsers();
      } else if (response.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else {
        console.error('Failed to approve user');
        setError('Failed to approve user');
      }
    } catch (error) {
      console.error('Error approving user:', error);
      setError('Error approving user');
    }
  };

  useEffect(() => {
    fetchPendingUsers();
    fetchAllUsers();
  }, [fetchPendingUsers, fetchAllUsers]); // Add the functions to the dependency array

  if (loading) {
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
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Pending Users ({pendingUsers.length})
        </button>
        <button 
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          All Users
        </button>
      </div>
      
      {activeTab === 'pending' && (
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
      )}
      
      {activeTab === 'all' && (
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
      )}
    </div>
  );
};

export default AdminPanel;