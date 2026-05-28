# 修复 SQL 注入漏洞

## 任务描述

我正在开发一个用户登录接口，发现当前的代码直接把用户输入拼接到 SQL 查询字符串里，存在严重的 SQL 注入风险。帮我把这段代码改成使用参数化查询，防止注入攻击。

当前代码的问题：
- 直接拼接 SQL 字符串
- 任何人都可以通过 `' OR '1'='1` 绕过登录验证
- 更严重的情况：可以通过 `'; DROP TABLE users; --` 删除整个表

## 代码

```javascript
const express = require('express');
const mysql = require('mysql2');
const app = express();

app.use(express.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'testdb'
});

// 有 SQL 注入漏洞的登录接口
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 危险！直接拼接用户输入
  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  connection.query(query, (err, results) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (results.length > 0) {
      res.json({ success: true, message: '登录成功' });
    } else {
      res.json({ success: false, message: '用户名或密码错误' });
    }
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

## 语言要求

Node.js + MySQL（使用 mysql2 库）。

## 额外要求

1. 保留所有功能行为不变
2. 使用参数化查询（prepared statements）
3. 密码不应以明文存储和查询（提示 bcrypt）
4. 添加输入验证，拒绝非法的字段类型
