// @ts-nocheck
/**
 * WebSocket 并发测试
 *
 * 测试策略：
 * - 每个 describe 块启动独立的服务器实例
 * - 使用真实的 WebSocket 连接（非 mock）
 * - WSClient 包装 WebSocket，缓冲所有消息避免竞态条件
 * - 覆盖单客户端、多客户端并发、房间机制、心跳、边界情况
 * - 使用 --runInBand 避免端口冲突
 */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import WebSocket from 'ws';
import { ChatWebSocketServer, WSMessage, MESSAGE_TYPES } from '../src/wsServer';

// ==================== 工具函数 ====================

/** 等待指定时间 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/** 包装 WebSocket，自动缓冲所有消息，避免竞态条件 */
interface WSClient {
  ws: WebSocket;
  buffer: WSMessage[];
  close(): void;
  waitForType(type: string, timeoutMs?: number): Promise<WSMessage>;
  sendAndWait(msg: WSMessage, responseType: string, timeoutMs?: number): Promise<WSMessage>;
  send(msg: WSMessage): void;
}

/** 创建 WebSocket 客户端（带消息缓冲） */
async function createWSClient(port: number): Promise<WSClient> {
  return new Promise((resolve, reject) => {
    const buffer: WSMessage[] = [];
    const ws = new WebSocket(`ws://localhost:${port}`);

    ws.on('message', (data: WebSocket.RawData) => {
      try {
        buffer.push(JSON.parse(data.toString()));
      } catch { /* ignore malformed JSON */ }
    });

    ws.on('open', () => {
      const client: WSClient = {
        ws, buffer,
        close() { ws.close(); },
        waitForType(type: string, timeoutMs = 3000): Promise<WSMessage> {
          return new Promise((resolveMsg, rejectMsg) => {
            const idx = buffer.findIndex(m => m.type === type);
            if (idx >= 0) {
              resolveMsg(buffer.splice(idx, 1)[0]);
              return;
            }
            const timer = setTimeout(() => {
              ws.removeListener('message', msgHandler);
              rejectMsg(new Error(`等待消息 ${type} 超时`));
            }, timeoutMs);
            const msgHandler = (d: WebSocket.RawData) => {
              try {
                const m = JSON.parse(d.toString());
                if (m.type === type) { clearTimeout(timer); ws.removeListener('message', msgHandler); resolveMsg(m); }
              } catch { /* ignore */ }
            };
            ws.on('message', msgHandler);
          });
        },
        async sendAndWait(msg: WSMessage, responseType: string, timeoutMs?: number): Promise<WSMessage> {
          ws.send(JSON.stringify(msg));
          return client.waitForType(responseType, timeoutMs);
        },
        send(msg: WSMessage): void { ws.send(JSON.stringify(msg)); },
      };
      resolve(client);
    });

    ws.on('error', reject);
    setTimeout(() => reject(new Error('WebSocket 连接超时')), 5000);
  });
}

// ==================== 基本功能 ====================

describe('ChatWebSocketServer - 基本功能', () => {
  let server: ChatWebSocketServer;
  let port: number;

  beforeAll(async () => { server = new ChatWebSocketServer(); port = await server.start(); });
  afterAll(async () => { await server.stop(); });

  it('服务器应该能启动并分配端口', () => {
    expect(port).toBeGreaterThan(0);
    expect(server.connectionCount).toBe(0);
  });

  it('客户端应该能连接并收到欢迎消息', async () => {
    const cli = await createWSClient(port);
    const welcome = await cli.waitForType(MESSAGE_TYPES.WELCOME);
    expect(welcome.type).toBe(MESSAGE_TYPES.WELCOME);
    expect(welcome.payload).toHaveProperty('clientId');
    expect(server.connectionCount).toBe(1);
    cli.close();
    await sleep(50);
    expect(server.connectionCount).toBe(0);
  });

  it('客户端应该能发送和接收心跳', async () => {
    const cli = await createWSClient(port);
    await cli.waitForType(MESSAGE_TYPES.WELCOME);
    cli.send({ type: MESSAGE_TYPES.HEARTBEAT });
    const ack = await cli.waitForType(MESSAGE_TYPES.HEARTBEAT_ACK);
    expect(ack.type).toBe(MESSAGE_TYPES.HEARTBEAT_ACK);
    cli.close();
  });
});

// ==================== 广播 ====================

describe('ChatWebSocketServer - 广播', () => {
  let server: ChatWebSocketServer;
  let port: number;

  beforeAll(async () => { server = new ChatWebSocketServer(); port = await server.start(); });
  afterAll(async () => { await server.stop(); });

  it('发送者应该收到其他客户端的广播', async () => {
    const alice = await createWSClient(port);
    const bob = await createWSClient(port);
    await alice.waitForType(MESSAGE_TYPES.WELCOME);
    await bob.waitForType(MESSAGE_TYPES.WELCOME);
    alice.send({ type: MESSAGE_TYPES.BROADCAST, payload: { text: 'Hello everyone!' } });
    const bobMsg = await bob.waitForType(MESSAGE_TYPES.BROADCAST);
    expect(bobMsg.payload).toEqual({ text: 'Hello everyone!' });
    expect(bobMsg.from).toBeDefined();
    alice.close(); bob.close();
  });

  it('广播不应该发送给发送者自己', async () => {
    const cli = await createWSClient(port);
    await cli.waitForType(MESSAGE_TYPES.WELCOME);
    let receivedOwn = false;
    cli.ws.on('message', (d: WebSocket.RawData) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === MESSAGE_TYPES.BROADCAST) receivedOwn = true;
    });
    cli.send({ type: MESSAGE_TYPES.BROADCAST, payload: { text: 'test' } });
    await sleep(100);
    expect(receivedOwn).toBe(false);
    cli.close();
  });

  it('多个客户端并发广播不应丢失消息', async () => {
    const n = 10;
    const clients: WSClient[] = [];
    const counts: number[] = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      const c = await createWSClient(port);
      await c.waitForType(MESSAGE_TYPES.WELCOME);
      const idx = i;
      c.ws.on('message', (d: WebSocket.RawData) => {
        const msg = JSON.parse(d.toString());
        if (msg.type === MESSAGE_TYPES.BROADCAST) counts[idx]++;
      });
      clients.push(c);
    }
    clients.forEach((c, i) => c.send({ type: MESSAGE_TYPES.BROADCAST, payload: { text: `msg ${i}` } }));
    await sleep(200);
    for (let i = 0; i < n; i++) expect(counts[i]).toBe(n - 1);
    for (const c of clients) c.close();
  });
});

// ==================== 点对点消息 ====================

describe('ChatWebSocketServer - 点对点消息', () => {
  let server: ChatWebSocketServer;
  let port: number;

  beforeAll(async () => { server = new ChatWebSocketServer(); port = await server.start(); });
  afterAll(async () => { await server.stop(); });

  it('应该能发送点对点消息', async () => {
    const alice = await createWSClient(port);
    const bob = await createWSClient(port);
    await alice.waitForType(MESSAGE_TYPES.WELCOME);
    await bob.waitForType(MESSAGE_TYPES.WELCOME);
    alice.send({ type: MESSAGE_TYPES.CHAT, payload: { text: 'Hi' } });
    const received = await bob.waitForType(MESSAGE_TYPES.BROADCAST);
    expect(received.payload).toEqual({ text: 'Hi' });
    alice.close(); bob.close();
  });

  it('发送给不存在的客户端应返回错误', async () => {
    const cli = await createWSClient(port);
    await cli.waitForType(MESSAGE_TYPES.WELCOME);
    const err = await cli.sendAndWait(
      { type: MESSAGE_TYPES.DIRECT, to: 'no_such_client', payload: { text: 'hello' } },
      MESSAGE_TYPES.ERROR
    );
    expect(err.type).toBe(MESSAGE_TYPES.ERROR);
    expect(err.payload).toHaveProperty('message');
    cli.close();
  });
});

// ==================== 房间 ====================

describe('ChatWebSocketServer - 房间', () => {
  let server: ChatWebSocketServer;
  let port: number;

  beforeAll(async () => { server = new ChatWebSocketServer(); port = await server.start(); });
  afterAll(async () => { await server.stop(); });

  it('客户端应该能加入房间', async () => {
    const cli = await createWSClient(port);
    await cli.waitForType(MESSAGE_TYPES.WELCOME);
    const res = await cli.sendAndWait(
      { type: MESSAGE_TYPES.JOIN_ROOM, room: 'general' },
      MESSAGE_TYPES.ROOM_JOINED
    );
    expect(res.payload).toHaveProperty('room', 'general');
    cli.close();
  });

  it('房间内的消息应只发送给房间成员', async () => {
    const a = await createWSClient(port);
    const b = await createWSClient(port);
    const out = await createWSClient(port);
    await a.waitForType(MESSAGE_TYPES.WELCOME);
    await b.waitForType(MESSAGE_TYPES.WELCOME);
    await out.waitForType(MESSAGE_TYPES.WELCOME);
    await a.sendAndWait({ type: MESSAGE_TYPES.JOIN_ROOM, room: 'lobby' }, MESSAGE_TYPES.ROOM_JOINED);
    await b.sendAndWait({ type: MESSAGE_TYPES.JOIN_ROOM, room: 'lobby' }, MESSAGE_TYPES.ROOM_JOINED);
    let outReceived = false;
    out.ws.on('message', (d: WebSocket.RawData) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === MESSAGE_TYPES.ROOM_MESSAGE) outReceived = true;
    });
    a.send({ type: MESSAGE_TYPES.ROOM_MESSAGE, room: 'lobby', payload: { text: 'Hello room!' } });
    const bMsg = await b.waitForType(MESSAGE_TYPES.ROOM_MESSAGE);
    expect(bMsg.payload).toEqual({ text: 'Hello room!' });
    await sleep(100);
    expect(outReceived).toBe(false);
    a.close(); b.close(); out.close();
  });

  it('离开房间后不应再收到房间消息', async () => {
    const a = await createWSClient(port);
    const b = await createWSClient(port);
    await a.waitForType(MESSAGE_TYPES.WELCOME);
    await b.waitForType(MESSAGE_TYPES.WELCOME);
    await a.sendAndWait({ type: MESSAGE_TYPES.JOIN_ROOM, room: 'test' }, MESSAGE_TYPES.ROOM_JOINED);
    await b.sendAndWait({ type: MESSAGE_TYPES.JOIN_ROOM, room: 'test' }, MESSAGE_TYPES.ROOM_JOINED);
    await a.sendAndWait({ type: MESSAGE_TYPES.LEAVE_ROOM, room: 'test' }, MESSAGE_TYPES.ROOM_LEFT);
    let aReceived = false;
    a.ws.on('message', (d: WebSocket.RawData) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === MESSAGE_TYPES.ROOM_MESSAGE) aReceived = true;
    });
    b.send({ type: MESSAGE_TYPES.ROOM_MESSAGE, room: 'test', payload: { text: 'After leave' } });
    await sleep(100);
    expect(aReceived).toBe(false);
    a.close(); b.close();
  });
});

// ==================== 并发压力测试 ====================

describe('ChatWebSocketServer - 并发压力测试', () => {
  let server: ChatWebSocketServer;
  let port: number;

  beforeAll(async () => { server = new ChatWebSocketServer(); port = await server.start(); });
  afterAll(async () => { await server.stop(); });

  it('应支持 50 个客户端并发连接', async () => {
    const count = 50;
    const clients = await Promise.all(Array.from({ length: count }, () => createWSClient(port)));
    await Promise.all(clients.map(c => c.waitForType(MESSAGE_TYPES.WELCOME)));
    expect(server.connectionCount).toBe(count);
    for (const c of clients) c.close();
    await sleep(100);
    expect(server.connectionCount).toBe(0);
  });

  it('50 个客户端并发发送消息不应崩溃', async () => {
    const count = 50;
    const clients: WSClient[] = [];
    const counts: number[] = new Array(count).fill(0);
    for (let i = 0; i < count; i++) {
      const c = await createWSClient(port);
      await c.waitForType(MESSAGE_TYPES.WELCOME);
      const idx = i;
      c.ws.on('message', (d: WebSocket.RawData) => {
        const msg = JSON.parse(d.toString());
        if (msg.type === MESSAGE_TYPES.BROADCAST) counts[idx]++;
      });
      clients.push(c);
    }
    for (let i = 0; i < count; i++) {
      for (let j = 0; j < 10; j++) {
        clients[i].send({ type: MESSAGE_TYPES.BROADCAST, payload: { text: `${j} from ${i}` } });
      }
    }
    await sleep(500);
    for (let i = 0; i < count; i++) expect(counts[i]).toBe((count - 1) * 10);
    for (const c of clients) c.close();
    await sleep(100);
  });

  it('应能处理大量并发房间操作', async () => {
    const nClients = 30;
    const nRooms = 10;
    const clients = await Promise.all(Array.from({ length: nClients }, () => createWSClient(port)));
    await Promise.all(clients.map(c => c.waitForType(MESSAGE_TYPES.WELCOME)));
    await Promise.all(clients.map((c, i) =>
      c.sendAndWait({ type: MESSAGE_TYPES.JOIN_ROOM, room: `room_${i % nRooms}` }, MESSAGE_TYPES.ROOM_JOINED)
    ));
    for (let r = 0; r < nRooms; r++) {
      expect(server.getRoomClients(`room_${r}`)).toHaveLength(nClients / nRooms);
    }
    await Promise.all(clients.map((c, i) =>
      c.sendAndWait({ type: MESSAGE_TYPES.LEAVE_ROOM, room: `room_${i % nRooms}` }, MESSAGE_TYPES.ROOM_LEFT)
    ));
    for (let r = 0; r < nRooms; r++) {
      expect(server.getRoomClients(`room_${r}`)).toHaveLength(0);
    }
    for (const c of clients) c.close();
  });
});

// ==================== 边界情况 ====================

describe('ChatWebSocketServer - 边界情况', () => {
  let server: ChatWebSocketServer;
  let port: number;

  beforeAll(async () => { server = new ChatWebSocketServer(); port = await server.start(); });
  afterAll(async () => { await server.stop(); });

  it('发送非法 JSON 应返回错误消息', async () => {
    const cli = await createWSClient(port);
    await cli.waitForType(MESSAGE_TYPES.WELCOME);
    const errPromise = cli.waitForType(MESSAGE_TYPES.ERROR);
    cli.ws.send('not valid json');
    const err = await errPromise;
    expect(err.type).toBe(MESSAGE_TYPES.ERROR);
    cli.close();
  });

  it('未知消息类型应返回错误', async () => {
    const cli = await createWSClient(port);
    await cli.waitForType(MESSAGE_TYPES.WELCOME);
    const err = await cli.sendAndWait({ type: 'unknown_type' }, MESSAGE_TYPES.ERROR);
    expect(err.type).toBe(MESSAGE_TYPES.ERROR);
    cli.close();
  });

  it('客户端断开后服务器连接数应减少', async () => {
    const cli = await createWSClient(port);
    await cli.waitForType(MESSAGE_TYPES.WELCOME);
    expect(server.connectionCount).toBeGreaterThan(0);
    cli.close();
    await sleep(100);
    expect(server.connectionCount).toBe(0);
  });
});

describe('ChatWebSocketServer - 服务器停止后不接受新连接', () => {
  let server: ChatWebSocketServer;
  let port: number;

  beforeAll(async () => { server = new ChatWebSocketServer(); port = await server.start(); });
  afterAll(async () => { await server.stop(); });

  it('服务器停止后不应接受新连接', async () => {
    await server.stop();
    await expect(createWSClient(port)).rejects.toThrow();
  });
});

// ==================== 大规模并发 ====================

describe('ChatWebSocketServer - 大规模并发', () => {
  let server: ChatWebSocketServer;
  let port: number;

  beforeAll(async () => {
    server = new ChatWebSocketServer({ heartbeatIntervalMs: 60_000 });
    port = await server.start();
  }, 10000);

  afterAll(async () => { await server.stop(); });

  it('100 个客户端并发连接并发送消息', async () => {
    const count = 100;
    let total = 0;
    const clients = await Promise.all(Array.from({ length: count }, () => createWSClient(port)));
    await Promise.all(clients.map(c => c.waitForType(MESSAGE_TYPES.WELCOME, 10000)));
    expect(server.connectionCount).toBe(count);
    for (const c of clients) { c.ws.on('message', () => { total++; }); }
    clients.forEach(c => c.send({ type: MESSAGE_TYPES.BROADCAST, payload: { text: 'stress' } }));
    await sleep(1000);
    expect(total).toBeGreaterThan(0);
    for (const c of clients) c.close();
    await sleep(200);
    expect(server.connectionCount).toBe(0);
  }, 20000);
});
