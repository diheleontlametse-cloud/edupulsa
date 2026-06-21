const express = require('express');
const router = express.Router();
const db = require('../database');
const { hashPassword, comparePassword, generateToken } = require('../auth');

// Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  const hashed = hashPassword(password);
  db.run(
    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
    [name, email, hashed],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      const token = generateToken({ id: this.lastID, email, name, role: 'teacher' });
      res.json({ token, user: { id: this.lastID, name, email, role: 'teacher', profile_picture: null } });
    }
  );
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  db.get('SELECT * FROM users WHERE email = ?', [email], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    const valid = comparePassword(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });
    const token = generateToken(user);
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role, profile_picture: user.profile_picture }
    });
  });
});

// Update profile picture
router.put('/profile-picture', (req, res) => {
  const { user_id, profile_picture } = req.body;
  if (!user_id || !profile_picture) {
    return res.status(400).json({ error: 'user_id and profile_picture are required' });
  }
  db.run(
    'UPDATE users SET profile_picture = ? WHERE id = ?',
    [profile_picture, user_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

module.exports = router;
