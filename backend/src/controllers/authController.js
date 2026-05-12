const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      const e = new Error('Kullanıcı adı ve şifre zorunludur');
      e.statusCode = 400;
      throw e;
    }
    const { rows } = await query(
      'SELECT id, username, password, role, is_active FROM users WHERE username = $1',
      [username]
    );
    if (!rows.length || !rows[0].is_active) {
      const e = new Error('Geçersiz kullanıcı adı veya şifre');
      e.statusCode = 401;
      throw e;
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      const e = new Error('Geçersiz kullanıcı adı veya şifre');
      e.statusCode = 401;
      throw e;
    }
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login };
