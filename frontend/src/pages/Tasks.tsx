import { useState } from 'react';
import { useTasks, useClasses } from '../hooks/useData';
import { authFetch } from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, CheckSquare, Calendar, AlertCircle } from 'lucide-react';

export default function Tasks() {
  const { tasks, loading, refresh } = useTasks();
  const { classes } = useClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [filter, setFilter] = useState('all');
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    class_id: '',
    priority: 'medium',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      class_id: form.class_id ? Number(form.class_id) : null,
      status: editing ? editing.status : 'pending',
    };
    if (editing) {
      await authFetch(`/api/tasks/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, status: editing.status }),
      });
    } else {
      await authFetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setIsModalOpen(false);
    setEditing(null);
    setForm({ title: '', description: '', due_date: '', class_id: '', priority: 'medium' });
    refresh();
  };

  const handleEdit = (task: any) => {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description || '',
      due_date: task.due_date,
      class_id: task.class_id ? String(task.class_id) : '',
      priority: task.priority,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await authFetch(`/api/tasks/${id}`, { method: 'DELETE' });
    refresh();
  };

  const toggleStatus = async (task: any) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    await authFetch(`/api/tasks/${task.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...task, status: newStatus }),
    });
    refresh();
  };

  const filteredTasks = filter === 'all' ? tasks : tasks.filter((t: any) => t.status === filter);

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date() && dueDate !== new Date().toISOString().split('T')[0];
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 mt-1">Schedule and manage your teaching tasks.</p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ title: '', description: '', due_date: '', class_id: '', priority: 'medium' });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <div className="flex items-center gap-3">
        <label className="text-sm text-gray-600">Filter:</label>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        >
          <option value="all">All Tasks</option>
          <option value="pending">Pending</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="space-y-3">
        {filteredTasks.map((task: any) => (
          <div
            key={task.id}
            className={`bg-white rounded-xl border p-4 shadow-sm flex items-center gap-4 ${
              task.status === 'completed' ? 'border-gray-200 opacity-75' : 'border-gray-200'
            }`}
          >
            <button
              onClick={() => toggleStatus(task)}
              className={`p-2 rounded-lg transition-colors ${
                task.status === 'completed'
                  ? 'bg-green-100 text-green-600'
                  : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
            >
              <CheckSquare className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className={`font-medium ${task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                  {task.title}
                </p>
                {isOverdue(task.due_date) && task.status === 'pending' && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                    <AlertCircle className="w-3 h-3" />
                    Overdue
                  </span>
                )}
              </div>
              {task.description && (
                <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Calendar className="w-3 h-3" />
                  {new Date(task.due_date).toLocaleDateString()}
                </span>
                {task.class_name && (
                  <span className="text-xs text-gray-500">{task.class_name}</span>
                )}
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  task.priority === 'high' ? 'bg-red-100 text-red-700' :
                  task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                  'bg-green-100 text-green-700'
                }`}>
                  {task.priority}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleEdit(task)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <Pencil className="w-4 h-4 text-gray-500" />
              </button>
              <button onClick={() => handleDelete(task.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CheckSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No tasks found. Add your first task to stay organized.</p>
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Task' : 'Add Task'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Prepare Lesson Plan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Optional details..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <input
              type="date"
              required
              value={form.due_date}
              onChange={(e) => setForm({ ...form, due_date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (optional)</label>
            <select
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">No specific class</option>
              {classes.map((c: any) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
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
    </div>
  );
}
