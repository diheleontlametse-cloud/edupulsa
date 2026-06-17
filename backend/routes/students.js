const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all students (optionally filter by class_id)
router.get('/', (req, res) => {
  const { class_id } = req.query;
  let sql = 'SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id';
  const params = [];
  if (class_id) {
    sql += ' WHERE s.class_id = ?';
    params.push(class_id);
  }
  sql += ' ORDER BY s.created_at DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create student
router.post('/', (req, res) => {
  const { name, class_id, student_number } = req.body;
  db.run(
    'INSERT INTO students (name, class_id, student_number) VALUES (?, ?, ?)',
    [name, class_id, student_number],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, class_id, student_number });
    }
  );
});

// Update student
router.put('/:id', (req, res) => {
  const { name, class_id, student_number } = req.body;
  db.run(
    'UPDATE students SET name = ?, class_id = ?, student_number = ? WHERE id = ?',
    [name, class_id, student_number, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Delete student
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM students WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
