/**
 * ==================== 辅助函数 ====================
 */

/** 用户已认证（存在且激活） */
function isAuthenticated(user) {
  return Boolean(user && user.isActive);
}

/** 用户是管理员 */
function isAdmin(user) {
  return user.role === 'admin';
}

/** 用户是资源所有者 */
function isOwner(user, resource) {
  return resource.ownerId === user.id;
}

/** 用户有直接权限 */
function hasDirectPermission(user, resource, action) {
  return Boolean(
    user.permissions &&
    user.permissions.includes(`${resource.type}:${action}`)
  );
}

/** 资源的 allowedRoles 包含用户角色 */
function isRoleAllowed(resource, user) {
  return Boolean(
    resource.allowedRoles &&
    resource.allowedRoles.includes(user.role)
  );
}

/** 用户有删除权限 */
function canDelete(user, resource) {
  return user.role === 'admin' || user.role === 'owner';
}

/**
 * ==================== 主函数 ====================
 *
 * 使用卫语句消除深层嵌套，每个辅助函数职责单一。
 * 缩进不超过 2 层。
 */
function canAccessResource(user, resource, action) {
  // 卫语句：快速排除无效情况
  if (!isAuthenticated(user)) return false;
  if (user.isBanned) return false;
  if (!resource) return false;

  // 公开资源 + 读操作 —— 任何人都可以
  if (resource.isPublic && action === 'read') return true;

  // 管理员拥有全部权限
  if (isAdmin(user)) return true;

  // 非公开资源的拥有者
  if (!resource.isPublic && isOwner(user, resource)) return true;

  // 基于角色的访问控制
  if (isRoleAllowed(resource, user)) {
    if (action === 'read' || action === 'write') return true;
    if (action === 'delete' && canDelete(user, resource)) return true;
    return false;
  }

  // 基于直接权限的访问控制
  if (hasDirectPermission(user, resource, action)) return true;

  return false;
}

module.exports = { canAccessResource, isAuthenticated, isAdmin, isOwner, hasDirectPermission, isRoleAllowed, canDelete };
