const express = require('express');
const router = express.Router();
const db = require('../database');
const { checkTrialExpired } = require('../auth');
const { SUBSCRIPTION_TIERS } = require('../middleware/subscription');

// Get current user's subscription status
router.get('/status', (req, res) => {
  const userId = req.user.id;
  db.get('SELECT id, name, email, subscription_tier, subscription_status, trial_start, trial_end, subscription_start, subscription_end, created_at FROM users WHERE id = ?', [userId], (err, user) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!user) return res.status(404).json({ error: 'User not found' });

    checkTrialExpired(userId, (err, updatedUser) => {
      if (err) return res.status(500).json({ error: err.message });
      
      // Get current counts for each resource
      db.get('SELECT COUNT(*) as count FROM classes WHERE user_id = ?', [userId], (err, classes) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT COUNT(*) as count FROM students WHERE user_id = ?', [userId], (err, students) => {
          if (err) return res.status(500).json({ error: err.message });
          db.get('SELECT COUNT(*) as count FROM study_guides WHERE user_id = ?', [userId], (err, guides) => {
            if (err) return res.status(500).json({ error: err.message });
            db.get('SELECT COUNT(*) as count FROM tasks WHERE user_id = ?', [userId], (err, tasks) => {
              if (err) return res.status(500).json({ error: err.message });

              const tierInfo = SUBSCRIPTION_TIERS[updatedUser.subscription_tier] || SUBSCRIPTION_TIERS.free;
              const now = new Date();
              const trialEnd = updatedUser.trial_end ? new Date(updatedUser.trial_end) : null;
              const daysLeft = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : 0;

              res.json({
                subscription: {
                  tier: updatedUser.subscription_tier,
                  status: updatedUser.subscription_status,
                  trial_start: updatedUser.trial_start,
                  trial_end: updatedUser.trial_end,
                  subscription_start: updatedUser.subscription_start,
                  subscription_end: updatedUser.subscription_end,
                  days_left: daysLeft > 0 ? daysLeft : 0,
                  is_trial: updatedUser.subscription_status === 'trial',
                  is_expired: updatedUser.subscription_status === 'expired',
                },
                usage: {
                  classes: classes.count,
                  students: students.count,
                  study_guides: guides.count,
                  tasks: tasks.count,
                },
                tier_info: tierInfo,
                available_tiers: SUBSCRIPTION_TIERS
              });
            });
          });
        });
      });
    });
  });
});

// Upgrade subscription (simulated - no real payment integration yet)
router.post('/upgrade', (req, res) => {
  const { tier } = req.body;
  const userId = req.user.id;
  
  if (!tier || !['free', 'basic', 'pro'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier. Must be free, basic, or pro.' });
  }

  const now = new Date();
  const subscriptionEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  db.run(
    'UPDATE users SET subscription_tier = ?, subscription_status = ?, subscription_start = ?, subscription_end = ? WHERE id = ?',
    [tier, 'active', now.toISOString(), subscriptionEnd.toISOString(), userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      res.json({
        message: `Subscription upgraded to ${SUBSCRIPTION_TIERS[tier].name} successfully.`,
        tier,
        subscription_end: subscriptionEnd.toISOString(),
        price: SUBSCRIPTION_TIERS[tier].price
      });
    }
  );
});

// Cancel subscription (downgrade to free)
router.post('/cancel', (req, res) => {
  const userId = req.user.id;
  db.run(
    'UPDATE users SET subscription_tier = "free", subscription_status = "cancelled", subscription_end = NULL WHERE id = ?',
    [userId],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(404).json({ error: 'User not found' });
      res.json({ message: 'Subscription cancelled. You have been downgraded to the Free plan.' });
    }
  );
});

module.exports = router;
