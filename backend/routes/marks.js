const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all marks (optionally filter by class_id or student_id)
router.get('/', (req, res) => {
  const { class_id, student_id } = req.query;
  let sql = `SELECT m.*, s.name as student_name, c.name as class_name 
             FROM marks m 
             LEFT JOIN students s ON m.student_id = s.id 
             LEFT JOIN classes c ON m.class_id = c.id`;
  const params = [];
  const conditions = [];
  if (class_id) { conditions.push('m.class_id = ?'); params.push(class_id); }
  if (student_id) { conditions.push('m.student_id = ?'); params.push(student_id); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY m.date DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create mark
router.post('/', (req, res) => {
  const { student_id, class_id, assessment_name, assessment_type, marks, total_marks, date } = req.body;
  db.run(
    'INSERT INTO marks (student_id, class_id, assessment_name, assessment_type, marks, total_marks, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [student_id, class_id, assessment_name, assessment_type, marks, total_marks, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Update mark
router.put('/:id', (req, res) => {
  const { assessment_name, assessment_type, marks, total_marks, date } = req.body;
  db.run(
    'UPDATE marks SET assessment_name = ?, assessment_type = ?, marks = ?, total_marks = ?, date = ? WHERE id = ?',
    [assessment_name, assessment_type, marks, total_marks, date, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Delete mark
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM marks WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Get class averages
router.get('/class-averages/:class_id', (req, res) => {
  const sql = `SELECT 
    assessment_name, 
    AVG(marks / total_marks * 100) as average_percentage,
    COUNT(*) as count
    FROM marks 
    WHERE class_id = ? 
    GROUP BY assessment_name`;
  db.all(sql, [req.params.class_id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

module.exports = router;
