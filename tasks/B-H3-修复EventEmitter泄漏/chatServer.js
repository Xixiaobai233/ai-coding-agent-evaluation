const EventEmitter = require('events');

// ============ 聊天服务器 ============

class ChatServer extends EventEmitter {
  constructor() {
    super();
    this.users = new Map();
    this.rooms = new Map();
    this.messageHistory = [];
  }

  addUser(userId, socket) {
    this.users.set(userId, { id: userId, socket, rooms: [] });

    // BUG 1：每次 addUser 都注册新监听器，从不移除
    socket.on('message', (data) => {
      this.handleMessage(userId, data);
    });

    socket.on('disconnect', () => {
      this.removeUser(userId);
      // BUG 2：应该移除其他监听器，但没有
    });

    socket.on('typing', (data) => {
      this.broadcastToRoom(data.room, {
        type: 'typing',
        userId,
        isTyping: data.isTyping
      });
    });
  }

  removeUser(userId) {
    const user = this.users.get(userId);
    if (!user) return;

    for (const roomId of user.socket.rooms || []) {
      this.leaveRoom(userId, roomId);
    }

    this.users.delete(userId);
    // BUG 3：socket 上的监听器没有被清理
  }

  joinRoom(userId, roomId) {
    const user = this.users.get(userId);
    if (!user) return;

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }
    this.rooms.get(roomId).add(userId);

    if (!user.socket.rooms) user.socket.rooms = [];
    user.socket.rooms.push(roomId);

    // BUG 4：每次加入房间都添加监听器，从不移除
    this.on('room-message', (data) => {
      if (data.roomId === roomId) {
        user.socket.emit('message', data.message);
      }
    });
  }

  leaveRoom(userId, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) this.rooms.delete(roomId);
    }
    // BUG 5：没有移除 room-message 监听器
  }

  handleMessage(userId, data) {
    const msg = {
      userId,
      text: data.text,
      roomId: data.roomId,
      timestamp: Date.now()
    };
    this.messageHistory.push(msg);
    this.emit('room-message', { roomId: data.roomId, message: msg });
  }

  broadcastToRoom(roomId, data) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    for (const userId of room) {
      const user = this.users.get(userId);
      if (user) {
        user.socket.emit('broadcast', data);
      }
    }
  }
}

// ============ 问题 6：全局监听器 ============

function setupGlobalHandlers(server) {
  server.on('error', (err) => {
    console.error('服务器错误:', err);
  });

  server.on('user-connect', (userId) => {
    console.log(`用户连接: ${userId}`);
  });
  // 没有清理机制
}

// ============ 问题 7：轮询注册 ============

function createPollingService(server) {
  setInterval(() => {
    // 每次轮询都注册一个新的监听器
    server.once('stats', (stats) => {
      console.log('统计信息:', stats);
    });
  }, 1000);
}

module.exports = { ChatServer, setupGlobalHandlers, createPollingService };
