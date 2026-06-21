const express = require('express');
const router = express.Router();
const db = require('../database');
const { subscriptionLimitMiddleware } = require('../middleware/subscription');

// Get all classes for the authenticated user
router.get('/', (req, res) => {
  db.all('SELECT * FROM classes WHERE user_id = ? ORDER BY created_at DESC', [req.user.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create class - enforce subscription limit
router.post('/', subscriptionLimitMiddleware('classes'), (req, res) => {
  const { name, subject, grade_level } = req.body;
  db.run(
    'INSERT INTO classes (user_id, name, subject, grade_level) VALUES (?, ?, ?, ?)',
    [req.user.id, name, subject, grade_level],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, subject, grade_level });
    }
  );
});

// Update class (only if owned by user)
router.put('/:id', (req, res) => {
  const { name, subject, grade_level } = req.body;
  db.run(
    'UPDATE classes SET name = ?, subject = ?, grade_level = ? WHERE id = ? AND user_id = ?',
    [name, subject, grade_level, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
      res.json({ updated: this.changes });
    }
  );
});

// Delete class (only if owned by user)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM classes WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
