# 为 REST API 写集成测试

## 任务描述

我有一个 Todo API 服务，包含用户认证和任务管理功能。我需要你为它编写集成测试，测试完整的 HTTP 请求-响应流程，包括认证、CRUD 操作和权限校验。

## API 文档

### 认证
```http
POST /api/auth/register
Body: { "username": string, "password": string }
Response 201: { "id": number, "username": string }

POST /api/auth/login
Body: { "username": string, "password": string }
Response 200: { "token": string }
```

### 任务管理（需要 Authorization: Bearer <token>）

```http
GET /api/todos
Query: ?status=pending|completed&page=1&limit=20
Response 200: { "data": Todo[], "total": number, "page": number }

POST /api/todos
Body: { "title": string, "description"?: string, "dueDate"?: string }
Response 201: { "id": number, "title": string, ... }

PUT /api/todos/:id
Body: { "title"?: string, "status"?: string }
Response 200: { "id": number, ... }

DELETE /api/todos/:id
Response 204: no content

GET /api/todos/:id
Response 200: Todo | Response 404: { "error": "not found" }
```

## 要求

1. 使用 supertest（或内置 `node:test` 的 fetch）发送 HTTP 请求
2. 测试前启动服务器，测试后关闭
3. 测试数据库使用单独的测试库或内存数据库
4. 覆盖以下场景：
   - 成功注册、登录
   - 未认证请求返回 401
   - CRUD 完整生命周期
   - 分页查询
   - 删除不存在资源的 404
   - 创建任务时缺少必填字段的 400

## 语言要求

JavaScript/TypeScript，使用 Node.js。
