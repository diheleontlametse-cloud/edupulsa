import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useAttendance, useClasses, useStudents } from '../hooks/useData';
import { authFetch } from '../lib/api';
import { CalendarDays, CheckCircle, XCircle, MinusCircle, Save } from 'lucide-react';

export default function Attendance() {
  const { user } = useAuth();
  const { classes } = useClasses();
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { students, loading: studentsLoading } = useStudents(selectedClass);
  const { attendance, loading: attendanceLoading, refresh: refreshAttendance } = useAttendance(selectedClass, selectedDate);
  const [attendanceMap, setAttendanceMap] = useState<Record<number, string>>({});
  const [saving, setSaving] = useState(false);
  const [historyDates, setHistoryDates] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'record' | 'history'>('record');
  const [historyData, setHistoryData] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Build initial attendance map from fetched records
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

      if (records.length === 0) {
        alert('No attendance records to save.');
        setSaving(false);
        return;
      }

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
      refreshAttendance();
      alert(`Attendance saved for ${records.length} students on ${selectedDate}!`);
    } catch (err) {
      alert('Failed to save attendance. Please try again.');
    }
    setSaving(false);
  };

  // Fetch all dates with attendance for this class
  const fetchHistoryDates = async () => {
    if (!selectedClass) return;
    try {
      const res = await authFetch(`/api/attendance?class_id=${selectedClass}`);
      const data = await res.json();
      const dates = [...new Set(data.map((a: any) => a.date))].sort().reverse();
      setHistoryDates(dates as string[]);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    }
  };

  const fetchHistoryForDate = async (date: string) => {
    if (!selectedClass) return;
    setHistoryLoading(true);
    try {
      const res = await authFetch(`/api/attendance?class_id=${selectedClass}&date=${date}`);
      const data = await res.json();
      setHistoryData(data);
    } catch (err) {
      console.error('Failed to fetch history data:', err);
    }
    setHistoryLoading(false);
  };

  useEffect(() => {
    fetchHistoryDates();
  }, [selectedClass]);

  const loading = studentsLoading || attendanceLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 mt-1">Record daily attendance and view historical records.</p>
      </div>

      <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Class:</label>
          <select
            value={selectedClass}
            onChange={(e) => { setSelectedClass(e.target.value); setAttendanceMap({}); setHistoryData([]); }}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('record')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'record' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Record Attendance
          </button>
          <button
            onClick={() => { setViewMode('history'); fetchHistoryDates(); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewMode === 'history' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            View History
          </button>
        </div>
      </div>

      {viewMode === 'record' ? (
        <>
          {selectedClass ? (
            students.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No students in this class. Add students first.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Recording for <strong>{classes.find((c: any) => String(c.id) === selectedClass)?.name}</strong> on <strong>{selectedDate}</strong>
                  </div>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Student #</th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Present</th>
                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Absent</th>
                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Late</th>
                        <th className="text-center text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {students.map((student: any) => {
                        const status = mergedMap[student.id] || 'present';
                        const statusLabel = status === 'present' ? 'Present' : status === 'absent' ? 'Absent' : 'Late';
                        const statusColor = status === 'present' ? 'text-green-600' : status === 'absent' ? 'text-red-600' : 'text-amber-600';
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
                            <td className="px-6 py-4 text-center">
                              <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 font-medium shadow-sm"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save Attendance'}
                  </button>
                </div>
              </>
            )
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a class and date to record attendance.</p>
            </div>
          )}
        </>
      ) : (
        <>
          {selectedClass ? (
            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                Viewing history for <strong>{classes.find((c: any) => String(c.id) === selectedClass)?.name}</strong>
              </div>
              {historyDates.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No attendance records found for this class.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1 space-y-2">
                    <h3 className="text-sm font-semibold text-gray-700">Dates with Records</h3>
                    {historyDates.map((date) => (
                      <button
                        key={date}
                        onClick={() => fetchHistoryForDate(date)}
                        className="w-full text-left px-4 py-3 bg-white rounded-lg border border-gray-200 hover:border-primary-500 hover:bg-primary-50 transition-colors text-sm"
                      >
                        <div className="font-medium text-gray-900">{date}</div>
                        <div className="text-xs text-gray-500">Click to view details</div>
                      </button>
                    ))}
                  </div>
                  <div className="md:col-span-2">
                    {historyLoading ? (
                      <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                      </div>
                    ) : historyData.length > 0 ? (
                      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                          <h3 className="font-semibold text-gray-900">Attendance for {historyData[0]?.date}</h3>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-green-600">Present: {historyData.filter((a: any) => a.status === 'present').length}</span>
                            <span className="text-red-600">Absent: {historyData.filter((a: any) => a.status === 'absent').length}</span>
                            <span className="text-amber-600">Late: {historyData.filter((a: any) => a.status === 'late').length}</span>
                          </div>
                        </div>
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Student</th>
                              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Status</th>
                              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Recorded</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {historyData.map((record: any) => (
                              <tr key={record.id} className="hover:bg-gray-50">
                                <td className="px-6 py-3 text-sm text-gray-900">{record.student_name || record.student_id}</td>
                                <td className="px-6 py-3">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                    record.status === 'present' ? 'bg-green-100 text-green-700' :
                                    record.status === 'absent' ? 'bg-red-100 text-red-700' :
                                    'bg-amber-100 text-amber-700'
                                  }`}>
                                    {record.status === 'present' ? 'Present' : record.status === 'absent' ? 'Absent' : 'Late'}
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-sm text-gray-500">{new Date(record.created_at).toLocaleString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                        <p className="text-gray-500">Select a date from the list to view attendance details.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a class to view attendance history.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
