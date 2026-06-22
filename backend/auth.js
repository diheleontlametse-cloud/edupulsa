const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const JWT_SECRET = process.env.JWT_SECRET || 'teacherhub-secret-key-2024';

function hashPassword(password) {
  return bcrypt.hashSync(password, 10);
}

function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name, role: user.role, subscription_tier: user.subscription_tier || 'free', subscription_status: user.subscription_status || 'trial' },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

function authMiddleware(req, res, next) {
  // Check Authorization header first
  let token = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }
  // Fallback: check query param for SSE (EventSource can't send headers)
  if (!token && req.query.token) {
    token = req.query.token;
  }
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized - No token provided' });
  }
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized - Invalid token' });
  }
  req.user = decoded;
  next();
}

// Subscription tier limits
const SUBSCRIPTION_LIMITS = {
  free: { classes: 3, students: 30, lessonPlans: 10, studyGuides: 10, tasks: 20, assessments: 5, atps: 5, aiGeneration: false, downloads: false },
  basic: { classes: 999999, students: 100, lessonPlans: 50, studyGuides: 30, tasks: 999999, assessments: 50, atps: 50, aiGeneration: true, downloads: true },
  pro: { classes: 999999, students: 999999, lessonPlans: 999999, studyGuides: 999999, tasks: 999999, assessments: 999999, atps: 999999, aiGeneration: true, downloads: true },
};

function getSubscriptionLimits(tier) {
  return SUBSCRIPTION_LIMITS[tier] || SUBSCRIPTION_LIMITS.free;
}

// Check if trial is expired and downgrade if needed
function checkTrialExpired(userId, callback) {
  db.get('SELECT * FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) return callback(err, user);
    if (user.subscription_status === 'trial' && user.trial_end) {
      const trialEnd = new Date(user.trial_end);
      const now = new Date();
      if (now > trialEnd) {
        db.run('UPDATE users SET subscription_status = "expired", subscription_tier = "free" WHERE id = ?', [userId], (err) => {
          if (err) return callback(err, user);
          user.subscription_status = 'expired';
          user.subscription_tier = 'free';
          callback(null, user);
        });
      } else {
        callback(null, user);
      }
    } else {
      callback(null, user);
    }
  });
}

module.exports = { hashPassword, comparePassword, generateToken, verifyToken, authMiddleware, getSubscriptionLimits, checkTrialExpired };
