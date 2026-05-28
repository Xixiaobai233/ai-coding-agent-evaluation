const { describe, it } = require('node:test');
const assert = require('node:assert').strict;
const { canAccessResource } = require('./refactor.js');

describe('canAccessResource', () => {
  // ---- 验收标准中的正向 / 反向测试 ----
  it('[验收] admin 对非公开资源可 delete', () => {
    const r = canAccessResource(
      { id: 1, isActive: true, isBanned: false, role: 'admin' },
      { isPublic: false },
      'delete'
    );
    assert.strictEqual(r, true);
  });

  it('[验收] null 用户返回 false', () => {
    assert.strictEqual(canAccessResource(null, {}, 'read'), false);
  });

  it('[验收] 被禁用户返回 false', () => {
    const r = canAccessResource(
      { id: 1, isActive: true, isBanned: true, role: 'admin' },
      { isPublic: true },
      'read'
    );
    assert.strictEqual(r, false);
  });

  // ---- 基础守卫 ----
  it('undefined 用户返回 false', () => {
    assert.strictEqual(canAccessResource(undefined, {}, 'read'), false);
  });

  it('未激活用户返回 false', () => {
    assert.strictEqual(
      canAccessResource({ id: 1, isActive: false, isBanned: false }, { isPublic: true }, 'read'),
      false
    );
  });

  it('缺失 resource 返回 false', () => {
    assert.strictEqual(
      canAccessResource({ id: 1, isActive: true, isBanned: false }, null, 'read'),
      false
    );
  });

  // ---- 公开资源 ----
  it('公开资源 + read = true', () => {
    assert.strictEqual(
      canAccessResource({ id: 1, isActive: true, isBanned: false, role: 'viewer' }, { isPublic: true }, 'read'),
      true
    );
  });

  it('公开资源 + 非 read + 非 admin = false', () => {
    assert.strictEqual(
      canAccessResource({ id: 1, isActive: true, isBanned: false, role: 'viewer' }, { isPublic: true }, 'write'),
      false
    );
  });

  // ---- 管理员 ----
  it('admin 任意动作 = true', () => {
    assert.strictEqual(
      canAccessResource({ id: 1, isActive: true, isBanned: false, role: 'admin' }, { isPublic: false }, 'write'),
      true
    );
  });

  // ---- 资源所有者 ----
  it('私有资源所有者 = true', () => {
    assert.strictEqual(
      canAccessResource({ id: 1, isActive: true, isBanned: false, role: 'editor' }, { isPublic: false, ownerId: 1 }, 'write'),
      true
    );
  });

  it('私有资源非所有者 = false', () => {
    assert.strictEqual(
      canAccessResource({ id: 2, isActive: true, isBanned: false, role: 'editor' }, { isPublic: false, ownerId: 1 }, 'write'),
      false
    );
  });

  // ---- 角色访问控制 ----
  it('allowedRoles 包含角色 + read = true', () => {
    assert.strictEqual(
      canAccessResource(
        { id: 2, isActive: true, isBanned: false, role: 'editor' },
        { isPublic: false, ownerId: 1, allowedRoles: ['editor', 'admin'] },
        'read'
      ),
      true
    );
  });

  it('allowedRoles 包含角色 + write = true', () => {
    assert.strictEqual(
      canAccessResource(
        { id: 2, isActive: true, isBanned: false, role: 'editor' },
        { isPublic: false, ownerId: 1, allowedRoles: ['editor'] },
        'write'
      ),
      true
    );
  });

  it('allowedRoles 不包含角色 = false', () => {
    assert.strictEqual(
      canAccessResource(
        { id: 2, isActive: true, isBanned: false, role: 'viewer' },
        { isPublic: false, ownerId: 1, allowedRoles: ['editor'] },
        'read'
      ),
      false
    );
  });

  // ---- 删除权限 ----
  it('allowedRoles 包含 + owner 角色可 delete', () => {
    assert.strictEqual(
      canAccessResource(
        { id: 2, isActive: true, isBanned: false, role: 'owner' },
        { isPublic: false, ownerId: 1, allowedRoles: ['owner'] },
        'delete'
      ),
      true
    );
  });

  it('allowedRoles 包含 + 普通角色不可 delete', () => {
    assert.strictEqual(
      canAccessResource(
        { id: 2, isActive: true, isBanned: false, role: 'editor' },
        { isPublic: false, ownerId: 1, allowedRoles: ['editor'] },
        'delete'
      ),
      false
    );
  });

  // ---- 直接权限 ----
  it('有直接权限 = true', () => {
    assert.strictEqual(
      canAccessResource(
        { id: 2, isActive: true, isBanned: false, role: 'viewer', permissions: ['report:export'] },
        { isPublic: false, ownerId: 1, type: 'report' },
        'export'
      ),
      true
    );
  });

  it('无直接权限 = false', () => {
    assert.strictEqual(
      canAccessResource(
        { id: 2, isActive: true, isBanned: false, role: 'viewer', permissions: ['report:read'] },
        { isPublic: false, ownerId: 1, type: 'report' },
        'export'
      ),
      false
    );
  });
});
