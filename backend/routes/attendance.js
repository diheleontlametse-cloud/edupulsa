const express = require('express');
const router = express.Router();
const db = require('../database');

// Get attendance for a class on a specific date (for the authenticated user)
router.get('/', (req, res) => {
  const { class_id, date } = req.query;
  let sql = 'SELECT a.*, s.name as student_name FROM attendance a LEFT JOIN students s ON a.student_id = s.id WHERE a.user_id = ?';
  const params = [req.user.id];
  if (class_id) { sql += ' AND a.class_id = ?'; params.push(class_id); }
  if (date) { sql += ' AND a.date = ?'; params.push(date); }
  sql += ' ORDER BY a.date DESC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Record attendance (bulk insert or single)
router.post('/', (req, res) => {
  const records = Array.isArray(req.body) ? req.body : [req.body];
  const stmt = db.prepare(
    'INSERT INTO attendance (user_id, student_id, class_id, date, status) VALUES (?, ?, ?, ?, ?)'
  );
  let inserted = 0;
  records.forEach(({ student_id, class_id, date, status }) => {
    stmt.run([req.user.id, student_id, class_id, date, status], function (err) {
      if (!err) inserted++;
    });
  });
  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ inserted });
  });
});

// Update attendance status (only if owned by user)
router.put('/:id', (req, res) => {
  const { status } = req.body;
  db.run(
    'UPDATE attendance SET status = ? WHERE id = ? AND user_id = ?',
    [status, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
      res.json({ updated: this.changes });
    }
  );
});

// Delete attendance record by ID (only if owned by user)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM attendance WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
    res.json({ deleted: this.changes });
  });
});

// Delete ALL attendance records for a class on a specific date (only if owned by user)
router.delete('/', (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id || !date) {
    return res.status(400).json({ error: 'class_id and date are required' });
  }
  db.run(
    'DELETE FROM attendance WHERE class_id = ? AND date = ? AND user_id = ?',
    [class_id, date, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});

module.exports = router;
