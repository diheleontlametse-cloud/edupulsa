const express = require('express');
const router = express.Router();
const db = require('../database');
const { hashPassword, comparePassword, generateToken, checkTrialExpired } = require('../auth');
const { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } = require('../services/email');

// Generate a random 6-digit code
function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Generate a random reset token
function generateResetToken() {
  return require('crypto').randomBytes(32).toString('hex');
}

// Register - with 1 month free trial and email verification
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }
  const hashed = hashPassword(password);
  const verificationCode = generateCode();
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
  const trialStart = now.toISOString();
  const trialEndStr = trialEnd.toISOString();

  db.run(
    'INSERT INTO users (name, email, password, verification_code, is_verified, subscription_tier, subscription_status, trial_start, trial_end) VALUES (?, ?, ?, ?, 0, "free", "trial", ?, ?)',
    [name, email, hashed, verificationCode, trialStart, trialEndStr],
    async function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({ error: 'Email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }
      const user = { id: this.lastID, email, name, role: 'teacher', subscription_tier: 'free', subscription_status: 'trial' };
      const token = generateToken(user);

      // Send real verification email
      const emailResult = await sendVerificationEmail(email, name, verificationCode);

      res.json({
        token,
        user: { ...user, profile_picture: null, is_verified: 0 },
        trialEnd: trialEndStr,
        message: emailResult.sent
          ? 'Registration successful! Check your email for the verification code.'
          : `Registration successful! Your verification code is: ${verificationCode}`,
        emailSent: emailResult.sent,
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

    // Check trial expiration
    checkTrialExpired(user.id, (err, updatedUser) => {
      if (err) return res.status(500).json({ error: err.message });
      const token = generateToken(updatedUser);
      res.json({
        token,
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          role: updatedUser.role,
          profile_picture: updatedUser.profile_picture,
          is_verified: updatedUser.is_verified,
          subscription_tier: updatedUser.subscription_tier,
          subscription_status: updatedUser.subscription_status,
          trial_end: updatedUser.trial_end,
          subscription_end: updatedUser.subscription_end,
        },
        needsVerification: updatedUser.is_verified === 0,
        trialExpired: updatedUser.subscription_status === 'expired'
      });
    });
  });
});

// Verify email
router.post('/verify', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }
  db.get('SELECT * FROM users WHERE email = ? AND verification_code = ?', [email, code], async (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(400).json({ error: 'Invalid verification code' });
    db.run('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?', [user.id], async function (err) {
      if (err) return res.status(500).json({ error: err.message });
      // Send welcome email
      await sendWelcomeEmail(email, user.name);
      res.json({ message: 'Email verified successfully. You can now log in.' });
    });
  });
});

// Resend verification code
router.post('/resend-code', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const newCode = generateCode();
  db.run('UPDATE users SET verification_code = ? WHERE email = ? AND is_verified = 0', [newCode, email], async function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(400).json({ error: 'Email not found or already verified' });
    const emailResult = await sendVerificationEmail(email, 'User', newCode);
    res.json({
      message: emailResult.sent
        ? 'New code sent to your email.'
        : `New verification code: ${newCode}`,
      emailSent: emailResult.sent,
    });
  });
});

// Forgot password - generate reset token and send email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required' });
  const token = generateResetToken();
  const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hour
  db.run('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE email = ?', [token, expires, email], async function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(400).json({ error: 'Email not found' });
    db.get('SELECT name FROM users WHERE email = ?', [email], async (err, user) => {
      const emailResult = await sendPasswordResetEmail(email, user?.name || 'User', token);
      res.json({
        message: emailResult.sent
          ? 'Password reset email sent. Check your inbox.'
          : 'Password reset token generated. Check the app for the token.',
        emailSent: emailResult.sent,
      });
    });
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
