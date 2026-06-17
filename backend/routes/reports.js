const express = require('express');
const router = express.Router();
const db = require('../database');

// Student report - marks, attendance, summary
router.get('/student/:id', (req, res) => {
  const studentId = req.params.id;
  db.get('SELECT s.*, c.name as class_name, c.subject FROM students s LEFT JOIN classes c ON s.class_id = c.id WHERE s.id = ?', [studentId], (err, student) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    db.all('SELECT * FROM marks WHERE student_id = ? ORDER BY date DESC', [studentId], (err, marks) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all('SELECT * FROM attendance WHERE student_id = ? ORDER BY date DESC', [studentId], (err, attendance) => {
        if (err) return res.status(500).json({ error: err.message });

        const totalMarks = marks.length;
        const avgPercentage = totalMarks > 0
          ? marks.reduce((sum, m) => sum + (m.marks / m.total_marks * 100), 0) / totalMarks
          : 0;

        const totalAttendance = attendance.length;
        const presentCount = attendance.filter(a => a.status === 'present').length;
        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance * 100) : 0;

        res.json({
          student,
          marks,
          attendance,
          summary: {
            totalAssessments: totalMarks,
            averagePercentage: avgPercentage.toFixed(2),
            totalAttendanceDays: totalAttendance,
            attendanceRate: attendanceRate.toFixed(2),
            present: presentCount,
            absent: attendance.filter(a => a.status === 'absent').length,
            late: attendance.filter(a => a.status === 'late').length
          }
        });
      });
    });
  });
});

// Class report - all students, marks, attendance summary
router.get('/class/:id', (req, res) => {
  const classId = req.params.id;
  db.get('SELECT * FROM classes WHERE id = ?', [classId], (err, cls) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    db.all('SELECT * FROM students WHERE class_id = ? ORDER BY name', [classId], (err, students) => {
      if (err) return res.status(500).json({ error: err.message });

      db.all('SELECT * FROM marks WHERE class_id = ?', [classId], (err, allMarks) => {
        if (err) return res.status(500).json({ error: err.message });

        db.all('SELECT * FROM attendance WHERE class_id = ?', [classId], (err, allAttendance) => {
          if (err) return res.status(500).json({ error: err.message });

          const studentReports = students.map(student => {
            const studentMarks = allMarks.filter(m => m.student_id === student.id);
            const studentAttendance = allAttendance.filter(a => a.student_id === student.id);
            const avg = studentMarks.length > 0
              ? studentMarks.reduce((sum, m) => sum + (m.marks / m.total_marks * 100), 0) / studentMarks.length
              : 0;
            const attRate = studentAttendance.length > 0
              ? (studentAttendance.filter(a => a.status === 'present').length / studentAttendance.length * 100)
              : 0;
            return {
              ...student,
              averagePercentage: avg.toFixed(2),
              totalMarks: studentMarks.length,
              attendanceRate: attRate.toFixed(2),
              totalAttendanceDays: studentAttendance.length
            };
          });

          const assessmentAverages = {};
          allMarks.forEach(m => {
            if (!assessmentAverages[m.assessment_name]) {
              assessmentAverages[m.assessment_name] = { total: 0, count: 0 };
            }
            assessmentAverages[m.assessment_name].total += (m.marks / m.total_marks * 100);
            assessmentAverages[m.assessment_name].count += 1;
          });

          const classAvg = allMarks.length > 0
            ? allMarks.reduce((sum, m) => sum + (m.marks / m.total_marks * 100), 0) / allMarks.length
            : 0;

          res.json({
            class: cls,
            students: studentReports,
            assessmentAverages: Object.entries(assessmentAverages).map(([name, data]) => ({
              assessment_name: name,
              average: (data.total / data.count).toFixed(2),
              count: data.count
            })),
            classSummary: {
              totalStudents: students.length,
              totalMarks: allMarks.length,
              classAverage: classAvg.toFixed(2),
              totalAttendanceRecords: allAttendance.length
            }
          });
        });
      });
    });
  });
});

module.exports = router;
