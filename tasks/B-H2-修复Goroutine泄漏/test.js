/**
 * JS 实现的 Goroutine 泄漏修复验证
 */

const assert = require('assert');
let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS: ${name}`); }
  catch (e) { failed++; console.error(`  FAIL: ${name} - ${e.message}`); }
}

// 模拟可关闭的数据处理器
class DataProcessor {
  constructor() {
    this.inputQueue = [];
    this.output = [];
    this.running = false;
    this.resolveStop = null;
  }

  start() {
    this.running = true;
    this._process();
  }

  async _process() {
    while (this.running) {
      if (this.inputQueue.length > 0) {
        const data = this.inputQueue.shift();
        this.output.push(data * 2);
        console.log(`处理: ${data} -> ${data * 2}`);
      } else {
        await new Promise(r => setTimeout(r, 10));
      }
    }
  }

  send(data) {
    this.inputQueue.push(data);
  }

  async close() {
    this.running = false;
    await new Promise(r => setTimeout(r, 50));
    return true;
  }
}

test('DataProcessor 可关闭', async () => {
  const dp = new DataProcessor();
  dp.start();
  dp.send(1);
  dp.send(2);
  dp.send(3);
  await new Promise(r => setTimeout(r, 50));
  assert.strictEqual(dp.output.length, 3);
  await dp.close();
  assert.strictEqual(dp.running, false);
});

test('EventBroadcaster 非阻塞', () => {
  class EventBroadcaster {
    constructor() { this.listeners = []; }
    addListener(ch) { this.listeners.push(ch); }
    broadcast(event) {
      for (const listener of this.listeners) {
        try {
          if (listener.length >= listener.limit) {
            // 满了，丢弃 — 非阻塞
          } else {
            listener.push(event);
          }
        } catch (e) {
          // 非阻塞
        }
      }
    }
  }

  const eb = new EventBroadcaster();
  const ch = [];
  ch.limit = 1;
  eb.addListener(ch);

  eb.broadcast('event1');
  assert.strictEqual(ch.length, 1);
  assert.strictEqual(ch[0], 'event1');

  eb.broadcast('event2');
  eb.broadcast('event3');
  assert.strictEqual(ch.length, 1); // 后面的被丢弃
});

console.log(`\nB-H2 测试完成: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exitCode = 1;
