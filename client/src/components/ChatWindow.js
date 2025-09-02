import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import './ChatWindow.css';

const ChatWindow = ({ group }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const { currentUser } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!group) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/groups/${group._id}/messages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      
      const data = await response.json();
      
      // Handle different response formats
      let messagesArray = [];
      if (Array.isArray(data)) {
        messagesArray = data;
      } else if (data && data.messages && Array.isArray(data.messages)) {
        messagesArray = data.messages;
      } else if (data && data.data && Array.isArray(data.data)) {
        messagesArray = data.data;
      } else {
        console.error('Unexpected messages response format:', data);
      }
      
      setMessages(messagesArray);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    }
  }, [group]);

  useEffect(() => {
    if (group) {
      fetchMessages();
      
      // Connect to socket
      const newSocket = io('http://localhost:5000', {
        auth: {
          token: localStorage.getItem('token')
        }
      });
      
      setSocket(newSocket);
      
      // Join group room
      newSocket.emit('join group', group._id);
      
      // Listen for new messages
      newSocket.on('new message', (message) => {
        setMessages(prev => [...prev, message]);
      });
      
      // Listen for deleted messages
      newSocket.on('message deleted', (messageId) => {
        setMessages(prev => prev.filter(msg => msg._id !== messageId));
      });
      
      return () => {
        newSocket.emit('leave group', group._id);
        newSocket.disconnect();
      };
    }
  }, [group, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (newMessage.trim() && socket) {
      socket.emit('send message', {
        groupId: group._id,
        content: newMessage.trim()
      });
      
      setNewMessage('');
    }
  };

  const deleteMessage = (messageId) => {
    if (socket && currentUser.isAdmin) {
      socket.emit('delete message', { messageId });
    }
  };

  if (!group) {
    return (
      <div className="chat-window">
        <div className="no-group-selected">
          <h2>Select a group to start chatting</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h2>{group.name}</h2>
        <p>{group.description}</p>
      </div>
      <div className="messages-container">
        {messages.map(message => (
          <div key={message._id} className="message">
            <div className="message-header">
              <strong>{message.sender.username}</strong>
              <span>{new Date(message.createdAt).toLocaleTimeString()}</span>
              {currentUser.isAdmin && (
                <button 
                  onClick={() => deleteMessage(message._id)}
                  className="delete-message-btn"
                >
                  Delete
                </button>
              )}
            </div>
            <p>{message.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatWindow;