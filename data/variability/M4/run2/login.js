const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const app = express();

app.use(express.json());

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'password',
  database: 'testdb',
  waitForConnections: true,
});

// 安全登录 - 使用连接池 + 参数化查询 + bcrypt 验证
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 类型校验
    if (typeof username !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ success: false, message: 'Invalid input types' });
    }

    // 参数化查询，防止 SQL 注入
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: '用户名或密码错误' });
    }

    const match = await bcrypt.compare(password, rows[0].password);
    if (match) {
      return res.json({ success: true, message: '登录成功' });
    }
    return res.status(401).json({ success: false, message: '用户名或密码错误' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => {
  console.log('Server running on port 3000');
});
