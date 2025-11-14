const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store rooms and users
const rooms = new Map(); // roomId -> { users: Set, messages: Array }
const users = new Map(); // socketId -> { username, roomId }

// Helper function to get room info
function getRoomInfo(roomId) {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, {
      users: new Set(),
      messages: []
    });
  }
  return rooms.get(roomId);
}

// Socket.io connection
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room
  socket.on('join-room', ({ roomId, username }) => {
    // Leave previous room if any
    if (users.has(socket.id)) {
      const prevRoomId = users.get(socket.id).roomId;
      const prevRoom = getRoomInfo(prevRoomId);
      prevRoom.users.delete(socket.id);
      socket.leave(prevRoomId);
      io.to(prevRoomId).emit('user-left', {
        username: users.get(socket.id).username,
        userCount: prevRoom.users.size
      });
    }

    // Join new room
    socket.join(roomId);
    const room = getRoomInfo(roomId);
    room.users.add(socket.id);
    
    users.set(socket.id, { username, roomId });

    // Send room info to user
    socket.emit('room-joined', {
      roomId,
      userCount: room.users.size,
      messages: room.messages.slice(-50) // Last 50 messages
    });

    // Notify others in room
    socket.to(roomId).emit('user-joined', {
      username,
      userCount: room.users.size
    });

    console.log(`${username} joined room ${roomId}`);
  });

  // Send message
  socket.on('send-message', ({ message }) => {
    if (!users.has(socket.id)) return;

    const user = users.get(socket.id);
    const room = getRoomInfo(user.roomId);

    const messageData = {
      id: Date.now().toString(),
      username: user.username,
      message: message.trim(),
      timestamp: new Date().toISOString()
    };

    // Store message (keep last 100 messages per room)
    room.messages.push(messageData);
    if (room.messages.length > 100) {
      room.messages.shift();
    }

    // Broadcast to room
    io.to(user.roomId).emit('new-message', messageData);
  });

  // Get room list
  socket.on('get-rooms', () => {
    const roomList = Array.from(rooms.entries()).map(([roomId, room]) => ({
      roomId,
      userCount: room.users.size
    }));
    socket.emit('room-list', roomList);
  });

  // Disconnect
  socket.on('disconnect', () => {
    if (users.has(socket.id)) {
      const user = users.get(socket.id);
      const room = getRoomInfo(user.roomId);
      room.users.delete(socket.id);

      socket.to(user.roomId).emit('user-left', {
        username: user.username,
        userCount: room.users.size
      });

      // Clean up empty rooms after 5 minutes
      if (room.users.size === 0) {
        setTimeout(() => {
          if (rooms.has(user.roomId) && rooms.get(user.roomId).users.size === 0) {
            rooms.delete(user.roomId);
            console.log(`Room ${user.roomId} deleted (empty)`);
          }
        }, 5 * 60 * 1000);
      }

      users.delete(socket.id);
      console.log('User disconnected:', socket.id);
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 Socket.io ready for connections`);
});

