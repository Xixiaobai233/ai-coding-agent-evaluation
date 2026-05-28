const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const isValid = require('./isValid');

describe('isValid - 有效括号', () => {
  it('空字符串应返回 true', () => {
    assert.strictEqual(isValid(''), true);
  });

  it('单对括号 () 应返回 true', () => {
    assert.strictEqual(isValid('()'), true);
  });

  it('多种括号 ()[]{} 应返回 true', () => {
    assert.strictEqual(isValid('()[]{}'), true);
  });

  it('嵌套正确 {[]} 应返回 true', () => {
    assert.strictEqual(isValid('{[]}'), true);
  });

  it('不匹配 (] 应返回 false', () => {
    assert.strictEqual(isValid('(]'), false);
  });

  it('交叉错误 ([)] 应返回 false', () => {
    assert.strictEqual(isValid('([)]'), false);
  });

  it('只有左括号 ((( 应返回 false', () => {
    assert.strictEqual(isValid('((('), false);
  });

  it('只有右括号 ))) 应返回 false', () => {
    assert.strictEqual(isValid(')))'), false);
  });

  it('未闭合 (() 应返回 false', () => {
    assert.strictEqual(isValid('(()'), false);
  });

  it('长嵌套 {{[[(())]]}} 应返回 true', () => {
    assert.strictEqual(isValid('{{[[(())]]}}'), true);
  });
});
