const express = require('express');
const router = express.Router();
const db = require('../database');
const { subscriptionLimitMiddleware } = require('../middleware/subscription');

// Get all annual teaching plans for the authenticated user
router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM annual_teaching_plans WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Create annual teaching plan - enforce subscription limit
router.post('/', subscriptionLimitMiddleware('atps'), (req, res) => {
  const { title, grade, subject, term, content } = req.body;
  db.run(
    'INSERT INTO annual_teaching_plans (user_id, title, grade, subject, term, content) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, title, grade, subject, term, content],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Update annual teaching plan (only if owned by user)
router.put('/:id', (req, res) => {
  const { title, grade, subject, term, content } = req.body;
  db.run(
    'UPDATE annual_teaching_plans SET title = ?, grade = ?, subject = ?, term = ?, content = ? WHERE id = ? AND user_id = ?',
    [title, grade, subject, term, content, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
      res.json({ updated: this.changes });
    }
  );
});

// Delete annual teaching plan (only if owned by user)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM annual_teaching_plans WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
