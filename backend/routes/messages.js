const express = require('express');
const router = express.Router();
const db = require('../database');

// Get messages for a channel
router.get('/', (req, res) => {
  const { channel } = req.query;
  if (!channel) {
    return res.status(400).json({ error: 'channel is required' });
  }
  db.all(
    'SELECT * FROM messages WHERE channel = ? ORDER BY created_at ASC LIMIT 200',
    [channel],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// Get all unique channels with message counts
router.get('/channels', (req, res) => {
  db.all(
    'SELECT channel, COUNT(*) as messageCount FROM messages GROUP BY channel ORDER BY messageCount DESC',
    [],
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
    'INSERT INTO messages (sender_id, sender_name, channel, content) VALUES (?, ?, ?, ?)',
    [sender_id, sender_name || 'Anonymous', channel, content],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, sender_id, sender_name, channel, content, created_at: new Date().toISOString() });
    }
  );
});

// Delete a message (only by sender)
router.delete('/:id', (req, res) => {
  const { sender_id } = req.body;
  db.run(
    'DELETE FROM messages WHERE id = ? AND sender_id = ?',
    [req.params.id, sender_id],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ deleted: this.changes });
    }
  );
});

module.exports = router;
