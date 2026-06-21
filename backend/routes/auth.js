const express = require('express');
const router = express.Router();
const db = require('../database');
const { hashPassword, comparePassword, generateToken } = require('../auth');

// Generate a random 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a random reset token
function generateResetToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// Register
router.post('/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const hashed = hashPassword(password);
  const verificationCode = generateCode();
  db.run(
    'INSERT INTO users (name, email, password, verification_code, is_verified) VALUES (?, ?, ?, ?, 0)',
    [name, email, hashed, verificationCode],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      const token = generateToken({ id: this.lastID, email, name, role: 'teacher' });
      res.json({
        token,
        user: { id: this.lastID, name, email, role: 'teacher', profile_picture: null, is_verified: 0 },
        verificationCode,
        message: 'Registration successful. Please verify your email using the code provided.'
      });
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
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profile_picture: user.profile_picture,
        is_verified: user.is_verified
      },
      needsVerification: user.is_verified === 0,
      verificationCode: user.is_verified === 0 ? user.verification_code : undefined
    });
  });
});

// Verify email
router.post('/verify', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }
  db.get('SELECT * FROM users WHERE email = ? AND verification_code = ?', [email, code], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid verification code' });
    db.run('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?', [user.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Email verified successfully. You can now log in.' });
    });
  });
});

// Resend verification code
router.post('/resend-code', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const newCode = generateCode();
  db.run('UPDATE users SET verification_code = ? WHERE email = ? AND is_verified = 0', [newCode, email], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(400).json({ error: 'Email not found or already verified' });
    res.json({ message: 'New verification code generated.', verificationCode: newCode });
  });
});

// Forgot password - generate reset token
router.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const token = generateResetToken();
  const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour
  db.run('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [token, expires, email], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(400).json({ error: 'Email not found' });
    res.json({ message: 'Password reset token generated.', resetToken: token });
  });
});

// Reset password with token
router.post('/reset-password', (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Email, token, and new password are required' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  db.get('SELECT * FROM users WHERE email = ? AND reset_token = ? AND reset_token_expires > datetime("now")', [email, token], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid or expired token' });
    const hashed = hashPassword(newPassword);
    db.run('UPDATE users SET password = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?', [hashed, user.id], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Password reset successfully. You can now log in.' });
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
