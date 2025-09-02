import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import GroupList from '../components/GroupList';
import ChatWindow from '../components/ChatWindow';
import './Dashboard.css';

const Dashboard = () => {
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get the authentication token
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
      console.log('Groups API response:', data); // Debug log
      
      // Handle different response structures
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

  const handleLogout = () => {
    logout();
  };

  const retryFetchGroups = () => {
    fetchGroups();
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>College Chat App</h1>
        <div className="user-info">
          <span>Welcome, {currentUser.username}</span>
          {currentUser.isAdmin && (
            <a href="/admin" className="admin-link">Admin Panel</a>
          )}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
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
            <ChatWindow group={selectedGroup} />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;