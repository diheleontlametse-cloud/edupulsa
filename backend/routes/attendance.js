const express = require('express');
const router = express.Router();
const db = require('../database');

// Get attendance for a class on a specific date
router.get('/', (req, res) => {
  const { class_id, date } = req.query;
  let sql = 'SELECT a.*, s.name as student_name FROM attendance a LEFT JOIN students s ON a.student_id = s.id';
  const params = [];
  const conditions = [];
  if (class_id) { conditions.push('a.class_id = ?'); params.push(class_id); }
  if (date) { conditions.push('a.date = ?'); params.push(date); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
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
    'INSERT INTO attendance (student_id, class_id, date, status) VALUES (?, ?, ?, ?)'
  );
  let inserted = 0;
  records.forEach(({ student_id, class_id, date, status }) => {
    stmt.run([student_id, class_id, date, status], function (err) {
      if (!err) inserted++;
    });
  });
  stmt.finalize((err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ inserted });
  });
});

// Update attendance status
router.put('/:id', (req, res) => {
  const { status } = req.body;
  db.run(
    'UPDATE attendance SET status = ? WHERE id = ?',
    [status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Delete attendance record by ID
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM attendance WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

// Delete ALL attendance records for a class on a specific date
router.delete('/', (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id || !date) {
    return res.status(400).json({ error: 'class_id and date are required' });
  }
  db.run(
    'DELETE FROM attendance WHERE class_id = ? AND date = ?',
    [class_id, date],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});

module.exports = router;
