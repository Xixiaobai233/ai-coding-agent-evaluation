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

    // 修复 BUG 1：使用具名函数，便于移除
    const onMessage = (data) => {
      this.handleMessage(userId, data);
    };

    // 修复：disconnect 使用 once，断开后自动移除
    const onDisconnect = () => {
      this.removeUser(userId);
    };

    const onTyping = (data) => {
      this.broadcastToRoom(data.room, {
        type: 'typing',
        userId,
        isTyping: data.isTyping
      });
    };

    socket._listeners = { onMessage, onDisconnect, onTyping };

    socket.on('message', onMessage);
    socket.once('disconnect', onDisconnect);
    socket.on('typing', onTyping);
  }

  removeUser(userId) {
    const user = this.users.get(userId);
    if (!user) return;

    // 修复 BUG 3：清理 socket 上的所有监听器
    if (user.socket._listeners) {
      const { onMessage, onDisconnect, onTyping } = user.socket._listeners;
      user.socket.off('message', onMessage);
      user.socket.off('disconnect', onDisconnect);
      user.socket.off('typing', onTyping);
      delete user.socket._listeners;
    }

    for (const roomId of user.socket.rooms || []) {
      this.leaveRoom(userId, roomId);
    }

    this.users.delete(userId);
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

    // 修复 BUG 4 & 5：使用具名函数保存引用，便于移除
    const onRoomMessage = (data) => {
      if (data.roomId === roomId) {
        user.socket.emit('message', data.message);
      }
    };

    if (!user.socket._roomListeners) {
      user.socket._roomListeners = new Map();
    }
    // 离开之前加入的房间监听器
    if (user.socket._roomListeners.has(roomId)) {
      this.off('room-message', user.socket._roomListeners.get(roomId));
    }
    user.socket._roomListeners.set(roomId, onRoomMessage);
    this.on('room-message', onRoomMessage);
  }

  leaveRoom(userId, roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.delete(userId);
      if (room.size === 0) this.rooms.delete(roomId);
    }

    // 修复 BUG 5：移除 room-message 监听器
    const user = this.users.get(userId);
    if (user && user.socket._roomListeners && user.socket._roomListeners.has(roomId)) {
      const listener = user.socket._roomListeners.get(roomId);
      this.off('room-message', listener);
      user.socket._roomListeners.delete(roomId);
    }

    if (user && user.socket.rooms) {
      const idx = user.socket.rooms.indexOf(roomId);
      if (idx !== -1) user.socket.rooms.splice(idx, 1);
    }
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
  const onError = (err) => {
    console.error('服务器错误:', err);
  };

  const onUserConnect = (userId) => {
    console.log(`用户连接: ${userId}`);
  };

  server.on('error', onError);
  server.on('user-connect', onUserConnect);

  // 修复：返回移除函数，便于清理
  return function cleanup() {
    server.off('error', onError);
    server.off('user-connect', onUserConnect);
  };
}

// ============ 问题 7：轮询注册 ============

function createPollingService(server) {
  // 修复：只注册一次监听器，而非每次轮询都注册
  server.once('stats', (stats) => {
    console.log('统计信息:', stats);
  });

  setInterval(() => {
    // 轮询逻辑本身，不再注册监听器
    server.emit('request-stats');
  }, 1000);
}

module.exports = { ChatServer, setupGlobalHandlers, createPollingService };
