const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all classes
router.get('/', (req, res) => {
  db.all('SELECT * FROM classes ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create class
router.post('/', (req, res) => {
  const { name, subject, grade_level } = req.body;
  db.run(
    'INSERT INTO classes (name, subject, grade_level) VALUES (?, ?, ?)',
    [name, subject, grade_level],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, subject, grade_level });
    }
  );
});

// Update class
router.put('/:id', (req, res) => {
  const { name, subject, grade_level } = req.body;
  db.run(
    'UPDATE classes SET name = ?, subject = ?, grade_level = ? WHERE id = ?',
    [name, subject, grade_level, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Delete class
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM classes WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
