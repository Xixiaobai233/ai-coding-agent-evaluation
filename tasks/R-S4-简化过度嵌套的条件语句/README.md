# 简化过度嵌套的条件语句

## 任务描述

我有一个权限校验函数，条件层层嵌套，缩进深不可测，代码可读性极差。帮我用卫语句（guard clauses）、逻辑合并、提取方法等方式简化它。

## 当前代码

```javascript
function canAccessResource(user, resource, action) {
  if (user) {
    if (user.isActive) {
      if (user.isBanned) {
        return false;
      } else {
        if (resource) {
          if (resource.isPublic) {
            if (action === 'read') {
              return true;
            } else {
              if (user.role === 'admin') {
                return true;
              } else {
                return false;
              }
            }
          } else {
            if (resource.ownerId === user.id) {
              return true;
            } else {
              if (user.role === 'admin') {
                return true;
              } else {
                if (resource.allowedRoles) {
                  if (resource.allowedRoles.includes(user.role)) {
                    if (action === 'read' || action === 'write') {
                      return true;
                    } else if (action === 'delete') {
                      if (user.role === 'admin' || user.role === 'owner') {
                        return true;
                      } else {
                        return false;
                      }
                    } else {
                      return false;
                    }
                  } else {
                    if (user.permissions) {
                      if (user.permissions.includes(`${resource.type}:${action}`)) {
                        return true;
                      } else {
                        return false;
                      }
                    } else {
                      return false;
                    }
                  }
                } else {
                  return false;
                }
              }
            }
          }
        } else {
          return false;
        }
      }
    } else {
      return false;
    }
  } else {
    return false;
  }
}
```

## 要求

1. 使用卫语句（guard clause）提前返回，消除深层嵌套
2. 合并重复的条件分支
3. 将复杂条件拆分为语义化的辅助函数（如 `isAdmin(user)`, `isOwner(user, resource)`）
4. 最终代码缩进不超过 2 层
5. 功能逻辑完全不变

## 语言要求

JavaScript。
