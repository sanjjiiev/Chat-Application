const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Message = require('./models/Message');

require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/groups', require('./routes/groups'));
app.use('/api/admin', require('./routes/admin'));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.log(err));

// Socket.io for real-time messaging
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return next(new Error('Authentication error'));
    }
    
    socket.userId = user._id;
    socket.username = user.username;
    socket.isAdmin = user.isAdmin;
    next();
  } catch (error) {
    next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log(`${socket.username} connected`);
  
  // Join group room
  socket.on('join group', (groupId) => {
    socket.join(groupId);
    console.log(`${socket.username} joined group ${groupId}`);
  });
  
  // Leave group room
  socket.on('leave group', (groupId) => {
    socket.leave(groupId);
    console.log(`${socket.username} left group ${groupId}`);
  });
  
  // Send message
  socket.on('send message', async (data) => {
    try {
      const { groupId, content } = data;
      
      const message = new Message({
        content,
        group: groupId,
        sender: socket.userId
      });
      
      await message.save();
      
      const populatedMessage = await Message.findById(message._id)
        .populate('sender', 'username');
      
      io.to(groupId).emit('new message', populatedMessage);
    } catch (error) {
      socket.emit('error', 'Failed to send message');
    }
  });
  
  // Delete message (admin only)
  socket.on('delete message', async (data) => {
    try {
      if (!socket.isAdmin) {
        return socket.emit('error', 'Admin access required');
      }
      
      const { messageId } = data;
      const message = await Message.findById(messageId);
      
      if (!message) {
        return socket.emit('error', 'Message not found');
      }
      
      message.isDeleted = true;
      message.deletedBy = socket.userId;
      await message.save();
      
      io.to(message.group.toString()).emit('message deleted', messageId);
    } catch (error) {
      socket.emit('error', 'Failed to delete message');
    }
  });
  
  socket.on('disconnect', () => {
    console.log(`${socket.username} disconnected`);
  });
});

// Create default groups if they don't exist
const createDefaultGroups = async () => {
  const Group = require('./models/Group');
  const User = require('./models/User');
  
  const groups = [
    {
      name: 'Computer Science Study',
      description: 'Discussion group for Computer Science students',
      category: 'study'
    },
    {
      name: 'Engineering Study',
      description: 'Discussion group for Engineering students',
      category: 'study'
    },
    {
      name: 'College Events',
      description: 'Information about upcoming college events',
      category: 'event'
    },
    {
      name: 'Mathematics Study',
      description: 'Discussion group for Mathematics students',
      category: 'study'
    },
    {
      name: 'Student Activities',
      description: 'Planning and discussion for student activities',
      category: 'event'
    }
  ];
  
  // Find or create admin user
  let admin = await User.findOne({ isAdmin: true });
  if (!admin) {
    admin = new User({
      username: 'admin',
      email: 'admin@college.edu',
      password: 'admin123',
      isApproved: true,
      isAdmin: true
    });
    await admin.save();
    console.log('Default admin user created');
  }
  
  for (const groupData of groups) {
    const existingGroup = await Group.findOne({ name: groupData.name });
    if (!existingGroup) {
      const group = new Group({
        ...groupData,
        admin: admin._id,
        members: [admin._id]
      });
      await group.save();
      console.log(`Default group created: ${groupData.name}`);
    }
  }
};

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  createDefaultGroups();
});