const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all students for the authenticated user (optionally filter by class_id)
router.get('/', (req, res) => {
  const { class_id } = req.query;
  let sql = 'SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.user_id = ?';
  const params = [req.user.id];
  if (class_id) {
    sql += ' AND s.class_id = ?';
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
    'INSERT INTO students (user_id, name, class_id, student_number) VALUES (?, ?, ?, ?)',
    [req.user.id, name, class_id, student_number],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, name, class_id, student_number });
    }
  );
});

// Update student (only if owned by user)
router.put('/:id', (req, res) => {
  const { name, class_id, student_number } = req.body;
  db.run(
    'UPDATE students SET name = ?, class_id = ?, student_number = ? WHERE id = ? AND user_id = ?',
    [name, class_id, student_number, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
      res.json({ updated: this.changes });
    }
  );
});

// Delete student (only if owned by user)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM students WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
