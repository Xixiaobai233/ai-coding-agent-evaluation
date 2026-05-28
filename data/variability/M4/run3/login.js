const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json({ type: 'application/json' }));

const conn = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'testdb'
});

// 登录接口：安全修复版
app.post('/login', (req, res) => {
  const uname = req.body.username;
  const pwd = req.body.password;

  // 防御：类型检查防止 NoSQL 注入
  if (typeof uname !== 'string' || typeof pwd !== 'string') {
    return res.status(400).json({ success: false, message: '类型非法' });
  }

  // 防御：参数化查询代替字符串拼接
  const stmt = 'SELECT id, username, password FROM users WHERE username = ?';
  conn.execute(stmt, [uname], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '数据库错误' });
    }
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    bcrypt.compare(pwd, rows[0].password, (bcErr, same) => {
      if (bcErr) {
        return res.status(500).json({ error: '认证失败' });
      }
      if (same) {
        return res.json({ success: true, message: '登录成功' });
      }
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    });
  });
});

app.listen(3000);
