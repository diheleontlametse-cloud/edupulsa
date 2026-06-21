import { useState } from 'react';
import Modal from '../components/Modal';
import { Award, TrendingUp, Calendar, BookOpen, Gift } from 'lucide-react';
import { REWARD_CATEGORIES, BADGE_EMOJIS } from '../lib/const';

interface Reward {
  id: number;
  student: string;
  category: string;
  points: number;
  badge: string;
  description: string;
  date: string;
}

const BADGE_OPTIONS = [
  { key: 'star', label: 'Star', emoji: '⭐' },
  { key: 'trophy', label: 'Trophy', emoji: '🏆' },
  { key: 'medal', label: 'Medal', emoji: '🥇' },
  { key: 'book', label: 'Book', emoji: '📚' },
  { key: 'lightbulb', label: 'Lightbulb', emoji: '💡' },
  { key: 'rocket', label: 'Rocket', emoji: '🚀' },
  { key: 'heart', label: 'Heart', emoji: '❤️' },
  { key: 'shield', label: 'Shield', emoji: '🛡️' },
];

export default function Rewards() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    student: '',
    category: '',
    points: 10,
    badge: 'star',
    description: '',
  });

  const totalRewards = rewards.length;
  const topStudent = rewards.reduce((acc, r) => {
    acc[r.student] = (acc[r.student] || 0) + r.points;
    return acc;
  }, {} as Record<string, number>);
  const topStudentName = Object.keys(topStudent).length > 0
    ? Object.entries(topStudent).sort((a, b) => b[1] - a[1])[0][0]
    : '-';
  const thisWeek = rewards.filter(r => {
    const d = new Date(r.date);
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    return d >= start;
  }).length;
  const thisTerm = rewards.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newReward: Reward = {
      id: Date.now(),
      student: form.student,
      category: form.category,
      points: Number(form.points),
      badge: form.badge,
      description: form.description,
      date: new Date().toISOString().split('T')[0],
    };
    setRewards([newReward, ...rewards]);
    setIsModalOpen(false);
    setForm({ student: '', category: '', points: 10, badge: 'star', description: '' });
  };

  const getCategoryLabel = (value: string) =>
    REWARD_CATEGORIES.find(c => c.value === value)?.label || value;

  const getCategoryColor = (value: string) =>
    REWARD_CATEGORIES.find(c => c.value === value)?.color || 'bg-gray-100 text-gray-700';

  return (
    <div className="min-h-full bg-sand-100 -m-6 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">Rewards & Recognition</h1>
          <p className="text-gray-600 mt-1">Celebrate student achievements and motivate excellence.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
        >
          <Gift className="w-4 h-4" />
          Give Reward
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Rewards Given</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">{totalRewards}</p>
            </div>
            <div className="p-3 rounded-lg bg-teal-50 text-teal-700">
              <Award className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Top Student</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">{topStudentName}</p>
            </div>
            <div className="p-3 rounded-lg bg-gold-100 text-gold-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">{thisWeek}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-50 text-blue-600">
              <Calendar className="w-6 h-6" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Term</p>
              <p className="text-2xl font-bold text-teal-900 mt-1">{thisTerm}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 text-purple-600">
              <BookOpen className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-teal-900">Recent Rewards</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Badge</th>
                <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rewards.map((reward) => (
                <tr key={reward.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium text-gray-900">{reward.student}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(reward.category)}`}>
                      {getCategoryLabel(reward.category)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{reward.points}</td>
                  <td className="px-6 py-4 text-xl">{BADGE_EMOJIS[reward.badge] || '⭐'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(reward.date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rewards.length === 0 && (
          <div className="text-center py-12">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No rewards yet. Give your first reward to celebrate a student!</p>
          </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Give Reward">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Student Name</label>
            <input
              type="text"
              required
              value={form.student}
              onChange={(e) => setForm({ ...form, student: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Thabo Mokoena"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select
              required
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select category</option>
              {REWARD_CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Points (1-50)</label>
            <input
              type="number"
              min={1}
              max={50}
              required
              value={form.points}
              onChange={(e) => setForm({ ...form, points: Math.min(50, Math.max(1, Number(e.target.value))) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Badge</label>
            <div className="grid grid-cols-4 gap-2">
              {BADGE_OPTIONS.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  onClick={() => setForm({ ...form, badge: b.key })}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                    form.badge === b.key
                      ? 'border-teal-600 bg-teal-50 text-teal-900'
                      : 'border-gray-200 hover:bg-gray-50 text-gray-600'
                  }`}
                >
                  <span className="text-xl">{b.emoji}</span>
                  <span className="text-xs">{b.label}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Why is this student receiving this reward?"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
            >
              Give Reward
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
