const { ChatServer, setupGlobalHandlers, createPollingService } = require('./chatServer');
const EventEmitter = require('events');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (e) {
    failed++;
    console.error(`  FAIL: ${name} - ${e.message}`);
  }
}

// 模拟 socket
function createMockSocket() {
  const socket = new EventEmitter();
  socket.rooms = [];
  return socket;
}

// 1. 添加和移除用户，监听器应被清理
test('用户断开后 socket 监听器被清理', () => {
  const server = new ChatServer();
  const socket = createMockSocket();
  server.addUser('user1', socket);

  // 检查 socket 上有监听器
  const msgCount = socket.listenerCount('message');
  const discCount = socket.listenerCount('disconnect');
  assert.strictEqual(msgCount, 1, "应有 1 个 message 监听器");
  assert.strictEqual(discCount, 1, "应有 1 个 disconnect 监听器（once）");

  // 模拟断开
  socket.emit('disconnect');

  // 检查监听器被清理
  assert.strictEqual(socket.listenerCount('message'), 0, "断开后 message 监听器应被清理");
  assert.strictEqual(socket.listenerCount('disconnect'), 0, "断开后 disconnect 监听器应被清理");
  assert.strictEqual(socket.listenerCount('typing'), 0, "断开后 typing 监听器应被清理");

  // user 应从 map 中移除
  assert.strictEqual(server.users.has('user1'), false);
});

// 2. room-message 监听器在 leaveRoom 后应被移除
test('leaveRoom 移除 room-message 监听器', () => {
  const server = new ChatServer();
  const socket = createMockSocket();
  server.addUser('user1', socket);
  server.joinRoom('user1', 'room1');

  const beforeCount = server.listenerCount('room-message');
  assert.strictEqual(beforeCount, 1, "加入房间后应有 1 个 room-message 监听器");

  server.leaveRoom('user1', 'room1');
  const afterCount = server.listenerCount('room-message');
  assert.strictEqual(afterCount, 0, "离开房间后 room-message 监听器应被移除");
});

// 3. 全局监听器可移除
test('setupGlobalHandlers 返回清理函数', () => {
  const server = new ChatServer();
  const cleanup = setupGlobalHandlers(server);

  assert.strictEqual(server.listenerCount('error'), 1);
  assert.strictEqual(server.listenerCount('user-connect'), 1);

  cleanup();
  assert.strictEqual(server.listenerCount('error'), 0, "清理后 error 监听器应移除");
  assert.strictEqual(server.listenerCount('user-connect'), 0, "清理后 user-connect 监听器应移除");
});

// 4. 轮询不累积监听器
test('createPollingService 只注册一次 stats 监听器', () => {
  const server = new ChatServer();
  createPollingService(server);

  assert.strictEqual(server.listenerCount('stats'), 1, "stats 监听器应只有 1 个");
  assert.strictEqual(server.listenerCount('request-stats'), 0);
});

// 5. 监听器零增长：100 个用户连接/断开
test('100 个用户连接/断开后无泄漏', () => {
  const server = new ChatServer();
  for (let i = 0; i < 100; i++) {
    const socket = createMockSocket();
    server.addUser(`user${i}`, socket);
    socket.emit('disconnect');
  }
  assert.strictEqual(server.listenerCount('room-message'), 0, "room-message 应归零");
  assert.strictEqual(server.users.size, 0, "users map 应为空");
});

// 6. 重复连接不泄漏
test('同一用户多次连接断开', () => {
  const server = new ChatServer();
  for (let i = 0; i < 10; i++) {
    const socket = createMockSocket();
    server.addUser('sameUser', socket);
    socket.emit('disconnect');
  }
  assert.strictEqual(server.users.size, 0);
  assert.strictEqual(server.listenerCount('room-message'), 0);
});

console.log(`\nB-H3 测试完成: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
