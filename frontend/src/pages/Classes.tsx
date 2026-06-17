import { useState } from 'react';
import { useClasses } from '../hooks/useData';
import { authFetch } from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, School } from 'lucide-react';

export default function Classes() {
  const { classes, loading, refresh } = useClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', subject: '', grade_level: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editing) {
      await authFetch(`/api/classes/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await authFetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setIsModalOpen(false);
    setEditing(null);
    setForm({ name: '', subject: '', grade_level: '' });
    refresh();
  };

  const handleEdit = (cls: any) => {
    setEditing(cls);
    setForm({ name: cls.name, subject: cls.subject, grade_level: cls.grade_level || '' });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure? This will also delete all students and marks in this class.')) return;
    await authFetch(`/api/classes/${id}`, { method: 'DELETE' });
    refresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-800"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
          <p className="text-gray-500 mt-1">Manage your SA classes and subjects.</p>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ name: '', subject: '', grade_level: '' }); setIsModalOpen(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Class
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {classes.map((cls: any) => (
          <div key={cls.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="p-3 bg-teal-50 rounded-lg">
                <School className="w-6 h-6 text-teal-800" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(cls)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => handleDelete(cls.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mt-4">{cls.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{cls.subject}</p>
            {cls.grade_level && (
              <span className="inline-block mt-3 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                Grade {cls.grade_level}
              </span>
            )}
          </div>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <School className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No classes yet. Add your first class to get started.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Class' : 'Add Class'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class Name</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="e.g., Grade 7A or 10B"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="e.g., Mathematical Literacy or Life Sciences"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
            <input
              type="text"
              value={form.grade_level}
              onChange={(e) => setForm({ ...form, grade_level: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="e.g., Foundation Phase, Grade 7, or FET (Grade 10-12)"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors">
              {editing ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
