const express = require('express');
const router = express.Router();
const db = require('../database');

// Get messages for a channel (only for the authenticated user)
router.get('/', (req, res) => {
  const { channel } = req.query;
  if (!channel) {
    return res.status(400).json({ error: 'channel is required' });
  }
  db.all(
    'SELECT * FROM messages WHERE user_id = ? AND channel = ? ORDER BY created_at ASC LIMIT 200',
    [req.user.id, channel],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get all unique channels for the authenticated user
router.get('/channels', (req, res) => {
  db.all(
    'SELECT channel, COUNT(*) as messageCount FROM messages WHERE user_id = ? GROUP BY channel ORDER BY messageCount DESC',
    [req.user.id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Send a message
router.post('/', (req, res) => {
  const { sender_id, sender_name, channel, content } = req.body;
  if (!sender_id || !channel || !content) {
    return res.status(400).json({ error: 'sender_id, channel, and content are required' });
  }
  db.run(
    'INSERT INTO messages (user_id, sender_id, sender_name, channel, content) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, sender_id, sender_name || 'Anonymous', channel, content],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, sender_id, sender_name, channel, content, created_at: new Date().toISOString() });
    }
  );
});

// Delete a message (only by sender or owner)
router.delete('/:id', (req, res) => {
  const { sender_id } = req.body;
  db.run(
    'DELETE FROM messages WHERE id = ? AND user_id = ? AND sender_id = ?',
    [req.params.id, req.user.id, sender_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});

module.exports = router;
