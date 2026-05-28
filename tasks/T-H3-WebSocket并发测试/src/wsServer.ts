// @ts-nocheck
/**
 * WebSocket 服务器 —— 支持多客户端并发连接、广播、房间、心跳。
 *
 * 功能：
 * - 客户端注册与在线管理
 * - 房间（Room）机制：客户端可以加入/离开房间
 * - 房间内消息广播
 * - 点对点消息
 * - 心跳检测（ping/pong）
 * - 连接数统计
 */
import { EventEmitter } from 'events';
import { WebSocketServer as WSServer, WebSocket, RawData } from 'ws';
import { createServer, Server as HTTPServer } from 'http';
import { AddressInfo } from 'net';

// ==================== 类型定义 ====================

export interface WSClient {
  id: string;
  ws: WebSocket;
  rooms: Set<string>;
  connectedAt: Date;
  lastPing: number;
}

export interface WSMessage {
  type: string;
  payload?: unknown;
  from?: string;
  to?: string;
  room?: string;
  timestamp?: number;
}

export interface WSServerOptions {
  /** 端口号，默认 0（自动分配） */
  port?: number;
  /** 心跳间隔（毫秒），默认 30000 */
  heartbeatIntervalMs?: number;
  /** 心跳超时（毫秒），默认 10000 */
  heartbeatTimeoutMs?: number;
}

// ==================== 消息类型常量 ====================

export const MESSAGE_TYPES = {
  // 系统消息
  HEARTBEAT: 'heartbeat',
  HEARTBEAT_ACK: 'heartbeat_ack',
  ERROR: 'error',
  WELCOME: 'welcome',

  // 房间操作
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  ROOM_JOINED: 'room_joined',
  ROOM_LEFT: 'room_left',
  ROOM_USERS: 'room_users',

  // 消息
  CHAT: 'chat',
  BROADCAST: 'broadcast',
  DIRECT: 'direct',
  ROOM_MESSAGE: 'room_message',
} as const;

// ==================== WebSocket 服务器 ====================

export class ChatWebSocketServer extends EventEmitter {
  private wss: WSServer | null = null;
  private httpServer: HTTPServer | null = null;
  private clients: Map<string, WSClient> = new Map();
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private readonly heartbeatIntervalMs: number;
  private readonly heartbeatTimeoutMs: number;
  private _port: number;

  constructor(options: WSServerOptions = {}) {
    super();
    this._port = options.port ?? 0;
    this.heartbeatIntervalMs = options.heartbeatIntervalMs ?? 30_000;
    this.heartbeatTimeoutMs = options.heartbeatTimeoutMs ?? 10_000;
  }

  /**
   * 启动 WebSocket 服务器。
   */
  async start(): Promise<number> {
    return new Promise((resolve) => {
      this.httpServer = createServer();

      this.wss = new WSServer({ server: this.httpServer });

      this.wss.on('connection', (ws: WebSocket, _req) => {
        this.handleConnection(ws);
      });

      this.httpServer.listen(this._port, () => {
        const address = this.httpServer!.address() as AddressInfo;
        this._port = address.port;

        // 启动心跳
        this.startHeartbeat();

        this.emit('started', { port: this._port });
        resolve(this._port);
      });
    });
  }

  /**
   * 停止服务器，清理所有连接。
   */
  async stop(): Promise<void> {
    // 停止心跳
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // 关闭所有客户端连接
    for (const client of this.clients.values()) {
      client.ws.close(1001, 'Server shutting down');
    }
    this.clients.clear();

    // 关闭 WebSocket 服务器
    if (this.wss) {
      await new Promise<void>((resolve) => {
        this.wss!.close(() => resolve());
      });
      this.wss = null;
    }

    // 关闭 HTTP 服务器
    if (this.httpServer) {
      await new Promise<void>((resolve) => {
        this.httpServer!.close(() => resolve());
      });
      this.httpServer = null;
    }

    this.emit('stopped');
  }

  // ==================== 连接管理 ====================

  private handleConnection(ws: WebSocket): void {
    const clientId = this.generateId();
    const client: WSClient = {
      id: clientId,
      ws,
      rooms: new Set(),
      connectedAt: new Date(),
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);

    // 发送欢迎消息
    this.sendToClient(client, {
      type: MESSAGE_TYPES.WELCOME,
      payload: { clientId },
    });

    ws.on('message', (data: RawData) => {
      try {
        const message: WSMessage = JSON.parse(data.toString());
        this.handleMessage(client, message);
      } catch {
        this.sendToClient(client, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: '无效消息格式' },
        });
      }
    });

    ws.on('close', () => {
      this.handleDisconnect(client);
    });

    ws.on('pong', () => {
      client.lastPing = Date.now();
    });

    ws.on('error', (err) => {
      this.emit('clientError', { clientId, error: err.message });
    });

    this.emit('connected', { clientId });
  }

  private handleDisconnect(client: WSClient): void {
    // 从所有房间中移除
    for (const room of client.rooms) {
      this.broadcastToRoom(room, {
        type: MESSAGE_TYPES.ROOM_LEFT,
        payload: { clientId: client.id },
      });
    }

    this.clients.delete(client.id);
    this.emit('disconnected', { clientId: client.id });
  }

  // ==================== 消息处理 ====================

  private handleMessage(client: WSClient, message: WSMessage): void {
    switch (message.type) {
      case MESSAGE_TYPES.HEARTBEAT:
        this.sendToClient(client, { type: MESSAGE_TYPES.HEARTBEAT_ACK });
        break;

      case MESSAGE_TYPES.JOIN_ROOM:
        this.handleJoinRoom(client, message);
        break;

      case MESSAGE_TYPES.LEAVE_ROOM:
        this.handleLeaveRoom(client, message);
        break;

      case MESSAGE_TYPES.CHAT:
        this.handleChat(client, message);
        break;

      case MESSAGE_TYPES.BROADCAST:
        this.handleBroadcast(client, message);
        break;

      case MESSAGE_TYPES.DIRECT:
        this.handleDirectMessage(client, message);
        break;

      case MESSAGE_TYPES.ROOM_MESSAGE:
        this.handleRoomMessage(client, message);
        break;

      default:
        this.sendToClient(client, {
          type: MESSAGE_TYPES.ERROR,
          payload: { message: `未知消息类型: ${message.type}` },
        });
    }
  }

  // ==================== 房间管理 ====================

  private handleJoinRoom(client: WSClient, message: WSMessage): void {
    const room = message.room || message.payload;
    if (!room || typeof room !== 'string') {
      this.sendToClient(client, {
        type: MESSAGE_TYPES.ERROR,
        payload: { message: '房间名不能为空' },
      });
      return;
    }

    client.rooms.add(room);
    this.sendToClient(client, {
      type: MESSAGE_TYPES.ROOM_JOINED,
      payload: { room, clientId: client.id },
    });

    // 通知房间其他成员
    this.broadcastToRoom(room, {
      type: MESSAGE_TYPES.ROOM_JOINED,
      payload: { room, clientId: client.id },
    }, client.id);

    // 发送房间用户列表
    const roomClients = this.getRoomClients(room);
    this.sendToClient(client, {
      type: MESSAGE_TYPES.ROOM_USERS,
      payload: { room, clients: roomClients },
    });
  }

  private handleLeaveRoom(client: WSClient, message: WSMessage): void {
    const room = message.room || message.payload;
    if (!room || typeof room !== 'string') return;

    client.rooms.delete(room);
    this.sendToClient(client, {
      type: MESSAGE_TYPES.ROOM_LEFT,
      payload: { room, clientId: client.id },
    });

    this.broadcastToRoom(room, {
      type: MESSAGE_TYPES.ROOM_LEFT,
      payload: { room, clientId: client.id },
    }, client.id);
  }

  // ==================== 消息发送 ====================

  private handleChat(client: WSClient, message: WSMessage): void {
    // 如果在房间中发送，则广播到房间
    if (message.room) {
      this.handleRoomMessage(client, message);
    } else {
      // 否则广播给所有
      this.handleBroadcast(client, message);
    }
  }

  private handleBroadcast(client: WSClient, message: WSMessage): void {
    const broadcastMsg: WSMessage = {
      type: MESSAGE_TYPES.BROADCAST,
      payload: message.payload,
      from: client.id,
      timestamp: Date.now(),
    };

    this.broadcastAll(broadcastMsg, client.id);
  }

  private handleDirectMessage(client: WSClient, message: WSMessage): void {
    const targetId = message.to;
    if (!targetId || typeof targetId !== 'string') {
      this.sendToClient(client, {
        type: MESSAGE_TYPES.ERROR,
        payload: { message: '缺少目标客户端 ID' },
      });
      return;
    }

    const target = this.clients.get(targetId);
    if (!target) {
      this.sendToClient(client, {
        type: MESSAGE_TYPES.ERROR,
        payload: { message: `客户端 ${targetId} 不在线` },
      });
      return;
    }

    this.sendToClient(target, {
      type: MESSAGE_TYPES.DIRECT,
      payload: message.payload,
      from: client.id,
      timestamp: Date.now(),
    });
  }

  private handleRoomMessage(client: WSClient, message: WSMessage): void {
    const room = message.room;
    if (!room || !client.rooms.has(room)) {
      this.sendToClient(client, {
        type: MESSAGE_TYPES.ERROR,
        payload: { message: '你不在该房间中' },
      });
      return;
    }

    const roomMsg: WSMessage = {
      type: MESSAGE_TYPES.ROOM_MESSAGE,
      payload: message.payload,
      from: client.id,
      room,
      timestamp: Date.now(),
    };

    this.broadcastToRoom(room, roomMsg, client.id);
  }

  // ==================== 发送辅助方法 ====================

  private sendToClient(client: WSClient, message: WSMessage): void {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  /** 广播给所有客户端（可选排除发送者） */
  broadcastAll(message: WSMessage, excludeClientId?: string): void {
    for (const client of this.clients.values()) {
      if (client.id !== excludeClientId) {
        this.sendToClient(client, message);
      }
    }
  }

  /** 广播给房间内所有客户端（可选排除发送者） */
  broadcastToRoom(room: string, message: WSMessage, excludeClientId?: string): void {
    for (const client of this.clients.values()) {
      if (client.rooms.has(room) && client.id !== excludeClientId) {
        this.sendToClient(client, message);
      }
    }
  }

  /** 获取房间内所有客户端 ID */
  getRoomClients(room: string): string[] {
    const result: string[] = [];
    for (const client of this.clients.values()) {
      if (client.rooms.has(room)) {
        result.push(client.id);
      }
    }
    return result;
  }

  // ==================== 心跳 ====================

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      for (const client of this.clients.values()) {
        // 如果超过心跳超时未收到 pong，断开连接
        if (now - client.lastPing > this.heartbeatTimeoutMs) {
          client.ws.terminate();
          this.clients.delete(client.id);
          this.emit('heartbeatTimeout', { clientId: client.id });
          continue;
        }
        // 发送 ping
        if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }
    }, this.heartbeatIntervalMs);
  }

  // ==================== 工具方法 ====================

  private generateId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  }

  /** 当前连接数 */
  get connectionCount(): number {
    return this.clients.size;
  }

  /** 当前端口 */
  get port(): number {
    return this._port;
  }

  /** 获取所有在线客户端 ID */
  getOnlineClients(): string[] {
    return Array.from(this.clients.keys());
  }
}
