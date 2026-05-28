# 修复 Node.js EventEmitter 内存泄漏

## 任务描述

我写了一个实时聊天服务器，使用 EventEmitter 来处理各种事件。服务刚启动时一切正常，但运行几小时后内存占用越来越高，最后被系统 OOM Killer 杀掉。

我检查了堆转储（heap dump），发现 `listener` 对象数量巨大——事件监听器在不停地添加，但从未被移除，导致内存泄漏。

帮我看看这段代码有什么问题并修复它。

当前代码的问题：
- 事件监听器被重复添加，每次某个操作都 `on()` 一个新监听器
- 没有在适当时机 `off()` / `removeListener()` 移除监听器
- EventEmitter 的 `listenerCount` 持续增长
- 应该使用 `once()` 的地方用了 `on()`

## 代码

```javascript
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
    // 用户断开后监听器仍然存在，socket 对象无法被 GC
    socket.on('message', (data) => {
      this.handleMessage(userId, data);
    });

    socket.on('disconnect', () => {
      this.removeUser(userId);

      // BUG 2：这里应该移除上面注册的监听器，但没有
      // 导致 socket 即使断开后仍然被回调引用，无法 GC
    });

    socket.on('typing', (data) => {
      // BUG 3：同样的，每次连上都添加，从不清理
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

    // 清理用户房间
    for (const roomId of user.socket.rooms || []) {
      this.leaveRoom(userId, roomId);
    }

    this.users.delete(userId);
    // BUG 4：用户从 Map 中删除了，但 socket 上的监听器还在
    // 导致 socket 对象无法被垃圾回收
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

    // BUG 5：每次加入房间都添加监听器
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

    // BUG 6：离开房间时没有移除 room-message 监听器
    // 监听器数量持续增长
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

// ============ 模拟使用 ============

// BUG 7：使用全局监听器，从不清理
function setupGlobalHandlers(server) {
  server.on('error', (err) => {
    console.error('服务器错误:', err);
  });

  server.on('user-connect', (userId) => {
    console.log(`用户连接: ${userId}`);
  });
  // 没有对应的 removeListener
}

// BUG 8：高频率轮询添加监听器
function createPollingService(server) {
  setInterval(() => {
    // 每次轮询都注册一个新的监听器
    server.once('stats', (stats) => {
      console.log('统计信息:', stats);
    });
    // 实际应该只注册一次
  }, 1000);
}

// BUG 9：对象作为事件名——虽然不会直接泄漏但增加混乱
const eventNames = {};
// 每次引用都创建新字符串作为事件名，但实际上应该用 Symbol 或常量

module.exports = { ChatServer, setupGlobalHandlers, createPollingService };
```

## 语言要求

Node.js (JavaScript/TypeScript)。
