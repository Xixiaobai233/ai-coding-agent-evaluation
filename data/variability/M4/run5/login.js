const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'testdb'
});

// 修复：参数化查询 + bcrypt 哈希对比 + 输入验证
app.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  // 严格类型验证
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).send({ success: false, message: '用户名和密码必须为字符串' });
  }

  // 使用 ? 占位符的参数化查询，彻底杜绝注入风险
  const QUERY = 'SELECT password FROM users WHERE username = ?';
  connection.query(QUERY, [username], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.sqlMessage || '数据库错误' });
    }

    if (!rows || rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    bcrypt.compare(password, rows[0].password, (cmpErr, same) => {
      if (cmpErr) {
        return res.status(500).json({ error: '认证过程出错' });
      }
      if (same) {
        return res.json({ success: true, message: '登录成功' });
      }
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    });
  });
});

app.listen(3000);
