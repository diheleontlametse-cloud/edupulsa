const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all study guides for the authenticated user
router.get('/', (req, res) => {
  const { class_id } = req.query;
  let sql = 'SELECT sg.*, c.name as class_name FROM study_guides sg LEFT JOIN classes c ON sg.class_id = c.id WHERE sg.user_id = ?';
  const params = [req.user.id];
  if (class_id) {
    sql += ' AND sg.class_id = ?';
    params.push(class_id);
  }
  sql += ' ORDER BY sg.created_at DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create study guide
router.post('/', (req, res) => {
  const { class_id, title, content, subject } = req.body;
  db.run(
    'INSERT INTO study_guides (user_id, class_id, title, content, subject) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, class_id, title, content, subject],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Update study guide (only if owned by user)
router.put('/:id', (req, res) => {
  const { title, content, subject } = req.body;
  db.run(
    'UPDATE study_guides SET title = ?, content = ?, subject = ? WHERE id = ? AND user_id = ?',
    [title, content, subject, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
      res.json({ updated: this.changes });
    }
  );
});

// Delete study guide (only if owned by user)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM study_guides WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
