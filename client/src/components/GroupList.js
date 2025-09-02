import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import './GroupList.css';

const GroupList = ({ groups, selectedGroup, onSelectGroup }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [groupList, setGroupList] = useState([]);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Ensure groups is always an array
    if (Array.isArray(groups)) {
      setGroupList(groups);
    } else if (groups && typeof groups === 'object') {
      // If groups is an object, try to extract an array from it
      if (groups.data && Array.isArray(groups.data)) {
        setGroupList(groups.data);
      } else if (groups.groups && Array.isArray(groups.groups)) {
        setGroupList(groups.groups);
      } else {
        // If we can't find an array, convert the object values to an array
        setGroupList(Object.values(groups));
      }
    } else {
      setGroupList([]);
    }
  }, [groups]);

  const filteredGroups = groupList.filter(group =>
    (group.name && group.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const joinGroup = async (groupId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        alert('Please log in again.');
        return;
      }

      const response = await fetch(`/api/groups/${groupId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const responseData = await response.json();
      
      if (response.ok) {
        // Refresh the page to update the UI
        window.location.reload();
      } else {
        console.error('Failed to join group:', responseData.message);
        alert(`Failed to join group: ${responseData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      alert('Error joining group. Please try again.');
    }
  };

  // Check if user is already a member of a group
  const isUserMember = (group) => {
    if (!group.members || !currentUser) return false;
    
    // Check if current user ID is in the members array
    return group.members.some(member => {
      // Handle both object and string representations of member IDs
      const memberId = typeof member === 'object' ? member._id : member;
      return memberId === currentUser.id;
    });
  };

  return (
    <div className="group-list">
      <h2>Groups</h2>
      <input
        type="text"
        placeholder="Search groups..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="group-search"
      />
      <div className="groups">
        {filteredGroups.length === 0 ? (
          <p>No groups available</p>
        ) : (
          filteredGroups.map(group => (
            <div 
              key={group._id} 
              className={`group-item ${selectedGroup?._id === group._id ? 'selected' : ''}`}
              onClick={() => onSelectGroup(group)}
            >
              <h3>{group.name}</h3>
              <p>{group.description}</p>
              <span className="group-category">{group.category}</span>
              
              {/* Show different button based on membership status */}
              {isUserMember(group) ? (
                <span className="member-badge">Already a member</span>
              ) : (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    joinGroup(group._id);
                  }}
                  className="join-btn"
                >
                  Join
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default GroupList;