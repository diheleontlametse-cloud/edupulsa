const express = require('express');
const router = express.Router();
const db = require('../database');
const { EventEmitter } = require('events');

// Global event emitter for chat messages (shared across all requests)
const chatEvents = new EventEmitter();
chatEvents.setMaxListeners(100);

// Get all messages for a channel (SHARED - all users in the same channel see the same messages)
router.get('/', (req, res) => {
  const { channel } = req.query;
  if (!channel) {
    return res.status(400).json({ error: 'channel is required' });
  }
  db.all(
    'SELECT * FROM messages WHERE channel = ? ORDER BY created_at ASC LIMIT 500',
    [channel],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// SSE stream for real-time messages in a channel (SHARED - all users get the same messages)
router.get('/stream', (req, res) => {
  const { channel } = req.query;
  if (!channel) {
    return res.status(400).json({ error: 'channel is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', channel })}

`);

  const listener = (msg) => {
    // Broadcast to ALL users in the same channel (no user_id filter)
    if (msg.channel === channel) {
      res.write(`data: ${JSON.stringify({ type: 'message', data: msg })}

`);
    }
  };

  chatEvents.on('new-message', listener);

  // Keep connection alive with ping every 30 seconds
  const pingInterval = setInterval(() => {
    res.write(`data: ${JSON.stringify({ type: 'ping' })}

`);
  }, 30000);

  // Clean up on disconnect
  req.on('close', () => {
    chatEvents.off('new-message', listener);
    clearInterval(pingInterval);
  });
});

// Get all unique channels with message counts (SHARED)
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

// Send a message - broadcasts to ALL users in the same channel
router.post('/', (req, res) => {
  const { sender_id, sender_name, channel, content } = req.body;
  if (!sender_id || !channel || !content) {
    return res.status(400).json({ error: 'sender_id, channel, and content are required' });
  }
  const created_at = new Date().toISOString();
  db.run(
    'INSERT INTO messages (user_id, sender_id, sender_name, channel, content, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [req.user.id, sender_id, sender_name || 'Anonymous', channel, content, created_at],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const msg = { id: this.lastID, sender_id, sender_name: sender_name || 'Anonymous', channel, content, created_at, user_id: req.user.id };
      // Broadcast to ALL SSE listeners (not just same user)
      chatEvents.emit('new-message', msg);
      res.json(msg);
    }
  );
});

// Delete a message (only by the sender who created it)
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
