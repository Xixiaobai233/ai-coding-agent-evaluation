const express = require('express');
const mysql = require('mysql2');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'testdb'
});

// 安全登录端点 - 防止 SQL 注入
app.post('/login', (req, res) => {
  const credentials = req.body;

  // 验证输入为字符串
  if (!credentials || typeof credentials.username !== 'string' || typeof credentials.password !== 'string') {
    return res.status(400).json({ success: false, message: '参数类型错误' });
  }

  // 使用 prepared statement 防止注入
  const sql = 'SELECT * FROM users WHERE username = ?';
  db.execute(sql, [credentials.username], (error, results) => {
    if (error) {
      return res.status(500).json({ error: '服务器内部错误' });
    }

    if (results.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    // bcrypt 对比哈希密码
    bcrypt.compare(credentials.password, results[0].password, (err, matched) => {
      if (err) {
        return res.status(500).json({ error: '认证失败' });
      }
      if (matched) {
        return res.json({ success: true, message: '登录成功' });
      }
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    });
  });
});

app.listen(3000, () => console.log('Login server on :3000'));
