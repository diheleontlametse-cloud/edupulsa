const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all study guides
router.get('/', (req, res) => {
  const { class_id } = req.query;
  let sql = 'SELECT sg.*, c.name as class_name FROM study_guides sg LEFT JOIN classes c ON sg.class_id = c.id';
  const params = [];
  if (class_id) {
    sql += ' WHERE sg.class_id = ?';
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
    'INSERT INTO study_guides (class_id, title, content, subject) VALUES (?, ?, ?, ?)',
    [class_id, title, content, subject],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Update study guide
router.put('/:id', (req, res) => {
  const { title, content, subject } = req.body;
  db.run(
    'UPDATE study_guides SET title = ?, content = ?, subject = ? WHERE id = ?',
    [title, content, subject, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Delete study guide
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM study_guides WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
