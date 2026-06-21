const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all marks for the authenticated user
router.get('/', (req, res) => {
  const { class_id, student_id } = req.query;
  let sql = `SELECT m.*, s.name as student_name, c.name as class_name 
             FROM marks m 
             LEFT JOIN students s ON m.student_id = s.id 
             LEFT JOIN classes c ON m.class_id = c.id
             WHERE m.user_id = ?`;
  const params = [req.user.id];
  if (class_id) { sql += ' AND m.class_id = ?'; params.push(class_id); }
  if (student_id) { sql += ' AND m.student_id = ?'; params.push(student_id); }
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
    'INSERT INTO marks (user_id, student_id, class_id, assessment_name, assessment_type, marks, total_marks, date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [req.user.id, student_id, class_id, assessment_name, assessment_type, marks, total_marks, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Update mark (only if owned by user)
router.put('/:id', (req, res) => {
  const { assessment_name, assessment_type, marks, total_marks, date } = req.body;
  db.run(
    'UPDATE marks SET assessment_name = ?, assessment_type = ?, marks = ?, total_marks = ?, date = ? WHERE id = ? AND user_id = ?',
    [assessment_name, assessment_type, marks, total_marks, date, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
      res.json({ updated: this.changes });
    }
  );
});

// Delete mark (only if owned by user)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM marks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
    res.json({ deleted: this.changes });
  });
});

// Get class averages (only for user's classes)
router.get('/class-averages/:class_id', (req, res) => {
  db.get('SELECT id FROM classes WHERE id = ? AND user_id = ?', [req.params.class_id, req.user.id], (err, cls) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!cls) return res.status(403).json({ error: 'Not found or not authorized' });
    const sql = `SELECT 
      assessment_name, 
      AVG(marks / total_marks * 100) as average_percentage,
      COUNT(*) as count
      FROM marks 
      WHERE class_id = ? AND user_id = ?
      GROUP BY assessment_name`;
    db.all(sql, [req.params.class_id, req.user.id], (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    });
  });
});

module.exports = router;
