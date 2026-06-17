import { useState } from 'react';
import { useMarks, useClasses, useStudents } from '../hooks/useData';
import { authFetch } from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, GraduationCap, TrendingUp } from 'lucide-react';

export default function Marks() {
  const { classes } = useClasses();
  const { students } = useStudents();
  const { marks, loading, refresh } = useMarks();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAveragesOpen, setIsAveragesOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [classAverages, setClassAverages] = useState<any[]>([]);
  const [form, setForm] = useState({
    student_id: '',
    class_id: '',
    assessment_name: '',
    assessment_type: 'test',
    marks: '',
    total_marks: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      student_id: Number(form.student_id),
      class_id: Number(form.class_id),
      marks: Number(form.marks),
      total_marks: Number(form.total_marks),
    };
    if (editing) {
      await authFetch(`/api/marks/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await authFetch('/api/marks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setIsModalOpen(false);
    setEditing(null);
    setForm({
      student_id: '', class_id: '', assessment_name: '', assessment_type: 'test',
      marks: '', total_marks: '', date: new Date().toISOString().split('T')[0],
    });
    refresh();
  };

  const handleEdit = (mark: any) => {
    setEditing(mark);
    setForm({
      student_id: String(mark.student_id),
      class_id: String(mark.class_id),
      assessment_name: mark.assessment_name,
      assessment_type: mark.assessment_type,
      marks: String(mark.marks),
      total_marks: String(mark.total_marks),
      date: mark.date,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await authFetch(`/api/marks/${id}`, { method: 'DELETE' });
    refresh();
  };

  const viewAverages = async (classId: string) => {
    const res = await authFetch(`/api/marks/class-averages/${classId}`);
    const data = await res.json();
    setClassAverages(data);
    setIsAveragesOpen(true);
  };

  const filteredMarks = selectedClass
    ? marks.filter((m: any) => String(m.class_id) === selectedClass)
    : marks;

  const filteredStudents = form.class_id
    ? students.filter((s: any) => String(s.class_id) === form.class_id)
    : students;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Marks</h1>
          <p className="text-gray-500 mt-1">Record and track student marks and assessments.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ student_id: '', class_id: '', assessment_name: '', assessment_type: 'test', marks: '', total_marks: '', date: new Date().toISOString().split('T')[0] });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Mark
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Filter by class:</label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="">All Classes</option>
          {classes.map((c: any) => (
            <option key={c.id} value={String(c.id)}>{c.name} - {c.subject}</option>
          ))}
        </select>
        {selectedClass && (
          <button
            onClick={() => viewAverages(selectedClass)}
            className="flex items-center gap-2 px-3 py-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors text-sm"
          >
            <TrendingUp className="w-4 h-4" />
            View Averages
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Student</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Assessment</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Type</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Score</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Date</th>
              <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredMarks.map((mark: any) => (
              <tr key={mark.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{mark.student_name || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{mark.assessment_name}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    mark.assessment_type === 'test' ? 'bg-blue-100 text-blue-700' :
                    mark.assessment_type === 'exam' ? 'bg-red-100 text-red-700' :
                    mark.assessment_type === 'assignment' ? 'bg-green-100 text-green-700' :
                    mark.assessment_type === 'quiz' ? 'bg-purple-100 text-purple-700' :
                    mark.assessment_type === 'project' ? 'bg-orange-100 text-orange-700' :
                    mark.assessment_type === 'investigation' ? 'bg-pink-100 text-pink-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {mark.assessment_type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {mark.marks} / {mark.total_marks}
                  <span className="text-gray-400 ml-1">({((mark.marks / mark.total_marks) * 100).toFixed(1)}%)</span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{new Date(mark.date).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(mark)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                    <button onClick={() => handleDelete(mark.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredMarks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No marks recorded yet. Add your first assessment.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Mark' : 'Add Mark'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
            <select
              required
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value, student_id: '' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a class</option>
              {classes.map((c: any) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
            <select
              required
              value={form.student_id}
              onChange={(e) => setForm({ ...form, student_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">Select a student</option>
              {filteredStudents.map((s: any) => (
                <option key={s.id} value={String(s.id)}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Name</label>
            <input
              type="text"
              required
              value={form.assessment_name}
              onChange={(e) => setForm({ ...form, assessment_name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Mid-term Exam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Type</label>
            <select
              value={form.assessment_type}
              onChange={(e) => setForm({ ...form, assessment_type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="test">Class Test</option>
              <option value="exam">Exam (June/Nov/Final)</option>
              <option value="assignment">Assignment / CASS Task</option>
              <option value="quiz">Controlled Test</option>
              <option value="project">PAT / SBA Project</option>
              <option value="investigation">Investigation</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marks Obtained</label>
              <input
                type="number"
                required
                min="0"
                step="0.1"
                value={form.marks}
                onChange={(e) => setForm({ ...form, marks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
              <input
                type="number"
                required
                min="1"
                step="0.1"
                value={form.total_marks}
                onChange={(e) => setForm({ ...form, total_marks: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isAveragesOpen} onClose={() => setIsAveragesOpen(false)} title="Class Averages">
        <div className="space-y-3">
          {classAverages.length === 0 ? (
            <p className="text-gray-500 text-sm">No marks recorded for this class yet.</p>
          ) : (
            classAverages.map((avg: any) => (
              <div key={avg.assessment_name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{avg.assessment_name}</p>
                  <p className="text-sm text-gray-500">{avg.count} students</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-primary-600">{avg.average_percentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">average</p>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  );
}
