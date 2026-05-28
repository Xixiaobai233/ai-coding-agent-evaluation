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

// 安全的登录接口：参数化查询 + bcrypt + 输入验证
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  // 输入验证：仅允许字符串类型
  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ success: false, message: '用户名和密码必须是字符串' });
  }

  // 参数化查询，使用 ? 占位符防止注入
  const query = 'SELECT * FROM users WHERE username = ?';
  connection.query(query, [username], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (result.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const userRecord = result[0];
    bcrypt.compare(password, userRecord.password, (cmpErr, isMatch) => {
      if (cmpErr) {
        return res.status(500).json({ error: '认证失败' });
      }
      if (isMatch) {
        return res.json({ success: true, message: '登录成功' });
      }
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    });
  });
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
