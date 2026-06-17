import { useState } from 'react';
import { useAttendance, useClasses, useStudents } from '../hooks/useData';
import { authFetch } from '../lib/api';
import { CalendarDays, CheckCircle, XCircle, MinusCircle, Save } from 'lucide-react';

export default function Attendance() {
  const { classes } = useClasses();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { students } = useStudents(selectedClass);
  const { attendance, loading, refresh } = useAttendance(selectedClass, selectedDate);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);

  // Build initial attendance map from authFetched records
  const existingMap: Record<number, string> = {};
  attendance.forEach((a: any) => {
    existingMap[a.student_id] = a.status;
  });

  const mergedMap = { ...existingMap, ...attendanceMap };

  const setStatus = (studentId: number, status: string) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSave = async () => {
    if (!selectedClass) return;
    setSaving(true);
    try {
      const records = Object.entries(mergedMap).map(([student_id, status]) => ({
        student_id: Number(student_id),
        class_id: Number(selectedClass),
        date: selectedDate,
        status,
      }));

      // Step 1: Delete old records for this class/date
      await authFetch(`/api/attendance?class_id=${selectedClass}&date=${selectedDate}`, {
        method: 'DELETE',
      });

      // Step 2: Insert new records
      await authFetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(records),
      });

      setAttendanceMap({});
      refresh();
      alert('Attendance saved successfully!');
    } catch (err) {
      alert('Failed to save attendance. Please try again.');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 mt-1">Record daily attendance for your classes.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Class:</label>
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setAttendanceMap({}); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="">Select a class</option>
            {classes.map((c: any) => (
              <option key={c.id} value={String(c.id)}>{c.name} - {c.subject}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => { setSelectedDate(e.target.value); setAttendanceMap({}); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {selectedClass && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        )}
      </div>

      {selectedClass ? (
        students.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No students in this class. Add students first.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Student #</th>
                  <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Present</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Absent</th>
                  <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Late</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((student: any) => {
                  const status = mergedMap[student.id] || 'present';
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">{student.student_number || '-'}</td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setStatus(student.id, 'present')}
                          className={`p-2 rounded-lg transition-colors ${
                            status === 'present' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setStatus(student.id, 'absent')}
                          className={`p-2 rounded-lg transition-colors ${
                            status === 'absent' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setStatus(student.id, 'late')}
                          className={`p-2 rounded-lg transition-colors ${
                            status === 'late' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <MinusCircle className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )
      ) : (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a class and date to record attendance.</p>
        </div>
      )}
    </div>
  );
}
