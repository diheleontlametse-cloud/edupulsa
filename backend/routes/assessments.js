const express = require('express');
const router = express.Router();
const db = require('../database');
const { subscriptionLimitMiddleware } = require('../middleware/subscription');

// Get all programme of assessments for the authenticated user
router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM programme_of_assessments WHERE user_id = ? ORDER BY created_at DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Create programme of assessment - enforce subscription limit
router.post('/', subscriptionLimitMiddleware('assessments'), (req, res) => {
  const { title, grade, subject, term, content } = req.body;
  db.run(
    'INSERT INTO programme_of_assessments (user_id, title, grade, subject, term, content) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, title, grade, subject, term, content],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Update programme of assessment (only if owned by user)
router.put('/:id', (req, res) => {
  const { title, grade, subject, term, content } = req.body;
  db.run(
    'UPDATE programme_of_assessments SET title = ?, grade = ?, subject = ?, term = ?, content = ? WHERE id = ? AND user_id = ?',
    [title, grade, subject, term, content, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
      res.json({ updated: this.changes });
    }
  );
});

// Delete programme of assessment (only if owned by user)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM programme_of_assessments WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
