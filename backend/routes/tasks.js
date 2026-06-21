const express = require('express');
const router = express.Router();
const db = require('../database');
const { subscriptionLimitMiddleware } = require('../middleware/subscription');

// Get all tasks for the authenticated user
router.get('/', (req, res) => {
  const { class_id, status } = req.query;
  let sql = 'SELECT t.*, c.name as class_name FROM tasks t LEFT JOIN classes c ON t.class_id = c.id WHERE t.user_id = ?';
  const params = [req.user.id];
  if (class_id) { sql += ' AND t.class_id = ?'; params.push(class_id); }
  if (status) { sql += ' AND t.status = ?'; params.push(status); }
  sql += ' ORDER BY t.due_date ASC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Create task - enforce subscription limit
router.post('/', subscriptionLimitMiddleware('tasks'), (req, res) => {
  const { title, description, due_date, class_id, priority } = req.body;
  db.run(
    'INSERT INTO tasks (user_id, title, description, due_date, class_id, priority) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, title, description, due_date, class_id, priority],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID });
    }
  );
});

// Update task (only if owned by user)
router.put('/:id', (req, res) => {
  const { title, description, due_date, class_id, priority, status } = req.body;
  db.run(
    'UPDATE tasks SET title = ?, description = ?, due_date = ?, class_id = ?, priority = ?, status = ? WHERE id = ? AND user_id = ?',
    [title, description, due_date, class_id, priority, status, req.params.id, req.user.id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
      res.json({ updated: this.changes });
    }
  );
});

// Delete task (only if owned by user)
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [req.params.id, req.user.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) return res.status(403).json({ error: 'Not found or not authorized' });
    res.json({ deleted: this.changes });
  });
});

module.exports = router;
