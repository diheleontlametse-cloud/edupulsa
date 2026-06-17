const express = require('express');
const router = express.Router();
const db = require('../database');

// Get all tasks
router.get('/', (req, res) => {
  const { class_id, status } = req.query;
  let sql = 'SELECT t.*, c.name as class_name FROM tasks t LEFT JOIN classes c ON t.class_id = c.id';
  const params = [];
  const conditions = [];
  if (class_id) { conditions.push('t.class_id = ?'); params.push(class_id); }
  if (status) { conditions.push('t.status = ?'); params.push(status); }
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY t.due_date ASC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create task
router.post('/', (req, res) => {
  const { title, description, due_date, class_id, priority } = req.body;
  db.run(
    'INSERT INTO tasks (title, description, due_date, class_id, priority) VALUES (?, ?, ?, ?, ?)',
    [title, description, due_date, class_id, priority],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Update task
router.put('/:id', (req, res) => {
  const { title, description, due_date, class_id, priority, status } = req.body;
  db.run(
    'UPDATE tasks SET title = ?, description = ?, due_date = ?, class_id = ?, priority = ?, status = ? WHERE id = ?',
    [title, description, due_date, class_id, priority, status, req.params.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ updated: this.changes });
    }
  );
});

// Delete task
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
