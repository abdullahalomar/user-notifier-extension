const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Map of userId -> { socketId, userId, userName }
const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log(`🔌 Client connected: ${socket.id}`);

  // Register user with their unique persistent userId and chosen userName
  socket.on('register_user', ({ userId, userName }) => {
    if (!userId) return;

    onlineUsers.set(userId, {
      socketId: socket.id,
      userId: userId,
      userName: userName || `User_${userId.slice(0, 5)}`
    });

    console.log(`👤 User registered: ${userName} (ID: ${userId})`);

    // Broadcast updated user list to all connected clients
    broadcastUserList();
  });

  // Handle name update
  socket.on('update_name', ({ userId, newName }) => {
    if (onlineUsers.has(userId)) {
      const user = onlineUsers.get(userId);
      user.userName = newName;
      onlineUsers.set(userId, user);
      console.log(`✏️ User ${userId} updated name to: ${newName}`);
      broadcastUserList();
    }
  });

  // Handle notification sound trigger sent to a targeted user
  socket.on('send_sound_trigger', ({ targetUserId, senderName, customMessage }) => {
    const targetUser = onlineUsers.get(targetUserId);

    if (targetUser) {
      console.log(`🔔 Sending sound notification from "${senderName}" to target "${targetUser.userName}" (${targetUserId})`);
      
      // Emit ONLY to the specific target socket
      io.to(targetUser.socketId).emit('play_sound_notification', {
        senderName: senderName || 'Someone',
        customMessage: customMessage || ''
      });
    } else {
      console.log(`⚠️ Target user ${targetUserId} not found or offline.`);
    }
  });

  // Handle client disconnect
  socket.on('disconnect', () => {
    console.log(`❌ Client disconnected: ${socket.id}`);
    
    // Remove user entry matching this socketId
    for (const [userId, user] of onlineUsers.entries()) {
      if (user.socketId === socket.id) {
        onlineUsers.delete(userId);
        console.log(`👋 User unregistered: ${user.userName} (${userId})`);
        break;
      }
    }

    broadcastUserList();
  });
});

function broadcastUserList() {
  const usersList = Array.from(onlineUsers.values());
  io.emit('update_user_list', usersList);
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 User Notifier Server listening on http://localhost:${PORT}`);
});
