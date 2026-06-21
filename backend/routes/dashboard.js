const express = require('express');
const router = express.Router();
const db = require('../database');

router.get('/', (req, res) => {
  const userId = req.user.id;
  db.get('SELECT COUNT(*) as count FROM classes WHERE user_id = ?', [userId], (err, classCount) => {
    if (err) return res.status(500).json({ error: err.message });
    db.get('SELECT COUNT(*) as count FROM students WHERE user_id = ?', [userId], (err, studentCount) => {
      if (err) return res.status(500).json({ error: err.message });
      db.get('SELECT COUNT(*) as count FROM tasks WHERE user_id = ? AND status = "pending"', [userId], (err, taskCount) => {
        if (err) return res.status(500).json({ error: err.message });
        db.get('SELECT COUNT(*) as count FROM study_guides WHERE user_id = ?', [userId], (err, guideCount) => {
          if (err) return res.status(500).json({ error: err.message });
          db.all('SELECT t.*, c.name as class_name FROM tasks t LEFT JOIN classes c ON t.class_id = c.id WHERE t.user_id = ? AND t.status = "pending" ORDER BY t.due_date ASC LIMIT 5', [userId], (err, upcomingTasks) => {
            if (err) return res.status(500).json({ error: err.message });
            db.all('SELECT sg.*, c.name as class_name FROM study_guides sg LEFT JOIN classes c ON sg.class_id = c.id WHERE sg.user_id = ? ORDER BY sg.created_at DESC LIMIT 5', [userId], (err, recentGuides) => {
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
