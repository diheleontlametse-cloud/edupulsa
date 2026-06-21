import { useState } from 'react';
import Modal from '../components/Modal';
import { Plus, MapPin, BookOpen, Calendar } from 'lucide-react';
import { SA_SUBJECTS, GRADES, DAYS_OF_WEEK } from '../lib/const';

interface ScheduleItem {
  id: number;
  subject: string;
  grade: string;
  day: number;
  startTime: string;
  endTime: string;
  room: string;
  notes: string;
}

const TIME_SLOTS = [
  '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00',
  '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
];

export default function Schedule() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    subject: '',
    grade: '',
    day: 1,
    startTime: '08:00',
    endTime: '09:00',
    room: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ScheduleItem = {
      id: Date.now(),
      subject: form.subject,
      grade: form.grade,
      day: Number(form.day),
      startTime: form.startTime,
      endTime: form.endTime,
      room: form.room,
      notes: form.notes,
    };
    setItems([...items, newItem]);
    setIsModalOpen(false);
    setForm({ subject: '', grade: '', day: 1, startTime: '08:00', endTime: '09:00', room: '', notes: '' });
  };

  const timeToIndex = (time: string) => TIME_SLOTS.indexOf(time);

  const getCardStyle = (startTime: string, endTime: string) => {
    const startIndex = timeToIndex(startTime);
    const endIndex = timeToIndex(endTime);
    const rowStart = startIndex >= 0 ? startIndex + 1 : 1;
    const rowSpan = endIndex >= 0 && startIndex >= 0 ? Math.max(1, endIndex - startIndex) : 1;
    return { gridRowStart: rowStart, gridRowEnd: `span ${rowSpan}` };
  };

  return (
    <div className="min-h-full bg-sand-100 -m-6 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">Class Schedule</h1>
          <p className="text-gray-600 mt-1">View and manage your weekly teaching timetable.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Event
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-gray-200">
              <div className="p-3 bg-teal-900 text-white text-xs font-semibold uppercase tracking-wider text-center border-r border-teal-800">
                Time
              </div>
              {DAYS_OF_WEEK.map((d) => (
                <div key={d.value} className="p-3 bg-teal-900 text-white text-xs font-semibold uppercase tracking-wider text-center border-r border-teal-800 last:border-r-0">
                  {d.label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-[80px_repeat(5,1fr)] grid-rows-[repeat(15,1fr)] relative">
              {TIME_SLOTS.map((time, idx) => (
                <div
                  key={time}
                  className="p-2 text-xs text-gray-500 text-center border-r border-gray-100 border-b border-gray-100"
                  style={{ gridRowStart: idx + 1, gridColumnStart: 1 }}
                >
                  {time}
                </div>
              ))}
              {DAYS_OF_WEEK.map((d) => (
                <div
                  key={d.value}
                  className="border-r border-gray-100 relative"
                  style={{ gridColumnStart: d.value + 1, gridRowStart: 1, gridRowEnd: 16 }}
                >
                  {TIME_SLOTS.map((_, idx) => (
                    <div key={idx} className="h-12 border-b border-gray-50" />
                  ))}
                </div>
              ))}
              {items.map((item) => {
                const style = getCardStyle(item.startTime, item.endTime);
                return (
                  <div
                    key={item.id}
                    className="m-1 p-2 rounded-lg bg-teal-50 border border-teal-200 text-xs shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    style={{ ...style, gridColumnStart: item.day + 1 }}
                  >
                    <div className="font-semibold text-teal-900 truncate">{item.subject}</div>
                    <div className="flex items-center gap-1 text-teal-700 mt-1">
                      <BookOpen className="w-3 h-3" />
                      Grade {item.grade}
                    </div>
                    <div className="flex items-center gap-1 text-teal-700 mt-0.5">
                      <MapPin className="w-3 h-3" />
                      {item.room}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-teal-900">Upcoming Sessions</h2>
        </div>
        <div className="p-6 space-y-3">
          {items.slice(0, 4).map((item) => (
            <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-teal-100 text-teal-700 rounded-lg">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">{item.subject}</p>
                <p className="text-sm text-gray-500">Grade {item.grade} &middot; {item.room}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-teal-900">{DAYS_OF_WEEK.find(d => d.value === item.day)?.label}</p>
                <p className="text-xs text-gray-500">{item.startTime} - {item.endTime}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Event">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <select
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select subject</option>
              {SA_SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
            <select
              required
              value={form.grade}
              onChange={(e) => setForm({ ...form, grade: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value="">Select grade</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Day</label>
            <select
              required
              value={form.day}
              onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              {DAYS_OF_WEEK.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <select
                required
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <select
                required
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {TIME_SLOTS.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
            <input
              type="text"
              required
              value={form.room}
              onChange={(e) => setForm({ ...form, room: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Room 101"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Optional notes..."
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
              Add Event
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
