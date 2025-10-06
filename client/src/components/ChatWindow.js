import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import EmojiPicker from 'emoji-picker-react';
import './ChatWindow.css';

const ChatWindow = ({ group, onBack }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [socket, setSocket] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const { currentUser } = useAuth();

  const fetchMessages = useCallback(async () => {
    if (!group) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/groups/${group._id}/messages`, {
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
        // Only add message if it has a valid sender
        if (message && message.sender) {
          setMessages(prev => [...prev, message]);
        } else {
          console.warn('Received message with invalid sender:', message);
        }
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      if (socket && data.fileUrl) {
        // Determine message type based on file type
        const type = file.type.startsWith('image/') ? 'image' : 'file';
        
        socket.emit('send message', {
          groupId: group._id,
          content: type === 'image' ? 'Shared an image' : `Shared a file: ${file.name}`,
          type: type,
          fileUrl: data.fileUrl,
          fileName: file.name
        });
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('File upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleEmojiClick = (emojiData) => {
    setNewMessage(prev => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const deleteMessage = (messageId) => {
    if (socket && currentUser.isAdmin) {
      socket.emit('delete message', { messageId });
    }
  };

  const renderMessageContent = (message) => {
    switch (message.type) {
      case 'image':
        return (
          <div className="message-image">
            <img src={message.fileUrl} alt={message.fileName || 'Shared image'} />
            {message.content && <p>{message.content}</p>}
          </div>
        );
      case 'file':
        return (
          <div className="message-file">
            <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
              <div className="file-icon">📎</div>
              <div className="file-info">
                <div className="file-name">{message.fileName || 'Download file'}</div>
                <div className="file-size">{message.content}</div>
              </div>
            </a>
          </div>
        );
      default:
        return <p>{message.content}</p>;
    }
  };

  if (!group) {
    return (
      <div className="chat-window-full">
        <div className="no-group-selected">
          <h2>Select a group to start chatting</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window-full">
      <div className="chat-header">
        <button className="back-button" onClick={onBack}>
          &larr; Back
        </button>
        <div className="group-info">
          <h2>{group.name}</h2>
          <p>{group.description}</p>
        </div>
      </div>
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div key={message._id} className={`message ${message.sender && message.sender._id === currentUser._id ? 'own-message' : ''}`}>
              <div className="message-header">
                <div className="message-sender">
                  {/* Safe access to sender properties */}
                  {message.sender?.username || 'Unknown User'}
                </div>
                <div className="message-time">
                  {new Date(message.createdAt).toLocaleTimeString()}
                </div>
                {currentUser.isAdmin && (
                  <button 
                    onClick={() => deleteMessage(message._id)}
                    className="delete-message-btn"
                  >
                    ×
                  </button>
                )}
              </div>
              {renderMessageContent(message)}
            </div>
          ))
        )}
        <div ref={messagesEndRef} className="scroll-anchor" />
      </div>
      
      <form onSubmit={handleSendMessage} className="message-form">
        {showEmojiPicker && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </div>
        )}
        
        <div className="message-input-container">
          <button 
            type="button" 
            className="emoji-btn"
            onClick={() => setShowEmojiPicker(prev => !prev)}
          >
            😊
          </button>
          
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
          />
          
          <button 
            type="button" 
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? '⏳' : '📎'}
          </button>
          
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
          
          <button type="submit" className="send-btn" disabled={uploading || !newMessage.trim()}>
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;