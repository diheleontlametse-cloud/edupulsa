import { useState } from 'react';
import { useClasses, useStudents, useReportStudent, useReportClass } from '../hooks/useData';
import { downloadCSV } from '../lib/api';
import {
  FileText,
  Download,
  TrendingUp,
  Users,
  GraduationCap,
  CalendarDays,
  CheckCircle,
} from 'lucide-react';

export default function Reports() {
  const { classes } = useClasses();
  const { students } = useStudents();
  const [reportType, setReportType] = useState<'student' | 'class'>('student');
  const [selectedId, setSelectedId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const { report: studentReport, loading: studentLoading } = useReportStudent(selectedId);
  const { report: classReport, loading: classLoading } = useReportClass(selectedClassId);

  const filteredStudents = selectedClassId
    ? students.filter((s: any) => String(s.class_id) === selectedClassId)
    : students;

  const exportStudentCSV = () => {
    if (!studentReport) return;
    const rows = [
      ['Student Report', ''],
      ['Name', studentReport.student.name],
      ['Class', studentReport.student.class_name || '-'],
      ['Subject', studentReport.student.subject || '-'],
      [''],
      ['Summary', ''],
      ['Total Assessments', studentReport.summary.totalAssessments],
      ['Average Percentage', studentReport.summary.averagePercentage + '%'],
      ['Total Attendance Days', studentReport.summary.totalAttendanceDays],
      ['Attendance Rate', studentReport.summary.attendanceRate + '%'],
      ['Present', studentReport.summary.present],
      ['Absent', studentReport.summary.absent],
      ['Late', studentReport.summary.late],
      [''],
      ['Marks', ''],
      ['Assessment', 'Type', 'Score', 'Total', 'Percentage', 'Date'],
      ...studentReport.marks.map((m: any) => [
        m.assessment_name,
        m.assessment_type,
        m.marks,
        m.total_marks,
        ((m.marks / m.total_marks) * 100).toFixed(1) + '%',
        m.date,
      ]),
      [''],
      ['Attendance', ''],
      ['Date', 'Status'],
      ...studentReport.attendance.map((a: any) => [a.date, a.status]),
    ];
    downloadCSV(`student-report-${studentReport.student.name}.csv`, rows);
  };

  const exportClassCSV = () => {
    if (!classReport) return;
    const rows = [
      ['Class Report', ''],
      ['Class', classReport.class.name],
      ['Subject', classReport.class.subject],
      ['Grade Level', classReport.class.grade_level || '-'],
      [''],
      ['Summary', ''],
      ['Total Students', classReport.classSummary.totalStudents],
      ['Total Marks', classReport.classSummary.totalMarks],
      ['Class Average', classReport.classSummary.classAverage + '%'],
      [''],
      ['Student Performance', ''],
      ['Name', 'Student #', 'Avg %', 'Marks Count', 'Attendance Rate', 'Attendance Days'],
      ...classReport.students.map((s: any) => [
        s.name,
        s.student_number || '-',
        s.averagePercentage + '%',
        s.totalMarks,
        s.attendanceRate + '%',
        s.totalAttendanceDays,
      ]),
      [''],
      ['Assessment Averages', ''],
      ['Assessment', 'Average', 'Count'],
      ...classReport.assessmentAverages.map((a: any) => [
        a.assessment_name,
        a.average + '%',
        a.count,
      ]),
    ];
    downloadCSV(`class-report-${classReport.class.name}.csv`, rows);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
        <p className="text-gray-500 mt-1">Generate progress reports and export data.</p>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Report Type:</label>
          <select
            value={reportType}
            onChange={(e) => { setReportType(e.target.value as 'student' | 'class'); setSelectedId(''); setSelectedClassId(''); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="student">Student Report</option>
            <option value="class">Class Report</option>
          </select>
        </div>
      </div>

      {reportType === 'student' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter by Class:</label>
              <select
                value={selectedClassId}
                onChange={(e) => { setSelectedClassId(e.target.value); setSelectedId(''); }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Classes</option>
                {classes.map((c: any) => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Select Student:</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">Select a student</option>
                {filteredStudents.map((s: any) => (
                  <option key={s.id} value={String(s.id)}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {studentLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {studentReport && !studentLoading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <FileText className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{studentReport.student.name}</h3>
                    <p className="text-sm text-gray-500">
                      {studentReport.student.class_name} — {studentReport.student.subject}
                    </p>
                  </div>
                </div>
                <button
                  onClick={exportStudentCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-blue-600" />
                    <p className="text-xs text-gray-500">Avg Percentage</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{studentReport.summary.averagePercentage}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <p className="text-xs text-gray-500">Attendance Rate</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{studentReport.summary.attendanceRate}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <p className="text-xs text-gray-500">Assessments</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{studentReport.summary.totalAssessments}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <CalendarDays className="w-4 h-4 text-amber-600" />
                    <p className="text-xs text-gray-500">Attendance Days</p>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{studentReport.summary.totalAttendanceDays}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Marks History</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Assessment</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Type</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Score</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Percentage</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {studentReport.marks.map((m: any) => (
                        <tr key={m.id}>
                          <td className="px-4 py-2 text-sm text-gray-900">{m.assessment_name}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              m.assessment_type === 'test' ? 'bg-blue-100 text-blue-700' :
                              m.assessment_type === 'exam' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>{m.assessment_type}</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-900">{m.marks} / {m.total_marks}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{((m.marks / m.total_marks) * 100).toFixed(1)}%</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{m.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Attendance History</h4>
                <div className="flex gap-2 flex-wrap">
                  {studentReport.attendance.map((a: any) => (
                    <div key={a.id} className={`px-3 py-1 rounded-full text-xs font-medium ${
                      a.status === 'present' ? 'bg-green-100 text-green-700' :
                      a.status === 'absent' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {a.date}: {a.status}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {reportType === 'class' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Select Class:</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a class</option>
              {classes.map((c: any) => (
                <option key={c.id} value={String(c.id)}>{c.name} - {c.subject}</option>
              ))}
            </select>
          </div>

          {classLoading && (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}

          {classReport && !classLoading && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary-50 rounded-lg">
                    <Users className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{classReport.class.name}</h3>
                    <p className="text-sm text-gray-500">{classReport.class.subject}</p>
                  </div>
                </div>
                <button
                  onClick={exportClassCSV}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Students</p>
                  <p className="text-2xl font-bold text-gray-900">{classReport.classSummary.totalStudents}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Class Average</p>
                  <p className="text-2xl font-bold text-gray-900">{classReport.classSummary.classAverage}%</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 mb-1">Total Marks</p>
                  <p className="text-2xl font-bold text-gray-900">{classReport.classSummary.totalMarks}</p>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Student Performance</h4>
                <div className="bg-gray-50 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Student</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Avg %</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Marks</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase px-4 py-2">Attendance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {classReport.students.map((s: any) => (
                        <tr key={s.id}>
                          <td className="px-4 py-2 text-sm font-medium text-gray-900">{s.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">
                            <span className={`font-semibold ${
                              Number(s.averagePercentage) >= 70 ? 'text-green-600' :
                              Number(s.averagePercentage) >= 50 ? 'text-amber-600' :
                              'text-red-600'
                            }`}>{s.averagePercentage}%</span>
                          </td>
                          <td className="px-4 py-2 text-sm text-gray-500">{s.totalMarks}</td>
                          <td className="px-4 py-2 text-sm text-gray-500">{s.attendanceRate}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3">Assessment Averages</h4>
                <div className="space-y-2">
                  {classReport.assessmentAverages.map((a: any) => (
                    <div key={a.assessment_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{a.assessment_name}</p>
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary-600">{a.average}%</p>
                        <p className="text-xs text-gray-500">{a.count} students</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
