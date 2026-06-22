const { authMiddleware, getSubscriptionLimits, checkTrialExpired } = require('../auth');
const db = require('../database');

// Subscription pricing tiers
const SUBSCRIPTION_TIERS = {
  free: { name: 'Free', price: 0, period: 'monthly', features: ['3 classes', '30 students', '10 lesson plans', '10 study guides', '20 tasks'] },
  basic: { name: 'Teacher Basic', price: 99, period: 'monthly', features: ['Unlimited classes', '100 students', '50 lesson plans/month', '30 study guides', 'Unlimited tasks', 'AI generation', 'Download reports'] },
  pro: { name: 'Teacher Pro', price: 199, period: 'monthly', features: ['Unlimited everything', 'Unlimited students', 'Unlimited lesson plans', 'Unlimited study guides', 'Unlimited tasks', 'Full AI access', 'Downloads', 'Priority support'] },
};

// Middleware to check if user can perform an action based on their subscription
function subscriptionLimitMiddleware(resource) {
  return (req, res, next) => {
    const userId = req.user.id;
    const tier = req.user.subscription_tier || 'free';
    const limits = getSubscriptionLimits(tier);

    // Check if trial expired
    if (req.user.subscription_status === 'trial' || req.user.subscription_status === 'expired') {
      checkTrialExpired(userId, (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (user.subscription_status === 'expired' && !limits[resource]) {
          return res.status(403).json({ error: 'Your free trial has expired. Please upgrade to continue.', code: 'TRIAL_EXPIRED' });
        }
        checkCount(userId, resource, limits, req, res, next);
      });
    } else {
      checkCount(userId, resource, limits, req, res, next);
    }
  };
}

function checkCount(userId, resource, limits, req, res, next) {
  const tableMap = {
    classes: 'classes',
    students: 'students',
    lessonPlans: 'study_guides',
    studyGuides: 'study_guides',
    tasks: 'tasks',
    assessments: 'programme_of_assessments',
    atps: 'annual_teaching_plans',
  };

  const table = tableMap[resource];
  if (!table) return next(); // No limit for this resource

  db.get(`SELECT COUNT(*) as count FROM ${table} WHERE user_id = ?`, [userId], (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    if (row.count >= limits[resource]) {
      return res.status(403).json({ 
        error: `You have reached your ${resource} limit for your ${limits.name || 'current'} plan. Please upgrade to add more.`,
        code: 'LIMIT_REACHED',
        current: row.count,
        limit: limits[resource],
        resource
      });
    }
    next();
  });
}

// Middleware to check if AI generation is allowed
function checkAiGeneration(req, res, next) {
  const tier = req.user.subscription_tier || 'free';
  const limits = getSubscriptionLimits(tier);
  if (!limits.aiGeneration) {
    return res.status(403).json({ 
      error: 'AI generation is not available on your plan. Please upgrade to Teacher Basic or Pro.',
      code: 'AI_NOT_ALLOWED'
    });
  }
  next();
}

// Middleware to check if downloads are allowed
function checkDownloads(req, res, next) {
  const tier = req.user.subscription_tier || 'free';
  const limits = getSubscriptionLimits(tier);
  if (!limits.downloads) {
    return res.status(403).json({ 
      error: 'Downloads are not available on your plan. Please upgrade to Teacher Basic or Pro.',
      code: 'DOWNLOAD_NOT_ALLOWED'
    });
  }
  next();
}

module.exports = { subscriptionLimitMiddleware, checkAiGeneration, checkDownloads, SUBSCRIPTION_TIERS };
