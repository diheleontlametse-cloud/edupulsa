const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  db.get('SELECT COUNT(*) as count FROM classes', [], (err, classCount) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT COUNT(*) as count FROM students', [], (err, studentCount) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT COUNT(*) as count FROM tasks WHERE status = "pending"', [], (err, taskCount) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT COUNT(*) as count FROM study_guides', [], (err, guideCount) => {
          if (err) return res.status(500).json({ error: err.message });
          db.all('SELECT * FROM tasks WHERE status = "pending" ORDER BY due_date ASC LIMIT 5', [], (err, upcomingTasks) => {
            if (err) return res.status(500).json({ error: err.message });
            db.all('SELECT * FROM study_guides ORDER BY created_at DESC LIMIT 5', [], (err, recentGuides) => {
              if (err) return res.status(500).json({ error: err.message });
              res.json({
                stats: {
                  classes: classCount.count,
                  students: studentCount.count,
                  pendingTasks: taskCount.count,
                  studyGuides: guideCount.count
                },
                upcomingTasks,
                recentGuides
              });
            });
          });
        });
      });
    });
  });
});

module.exports = router;
