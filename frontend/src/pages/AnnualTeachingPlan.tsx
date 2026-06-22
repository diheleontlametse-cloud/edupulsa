import { useState } from 'react';
import Modal from '../components/Modal';
import { Filter, CalendarDays, Sparkles, Loader2, Download, BookOpen } from 'lucide-react';
import { SA_SUBJECTS, GRADES } from '../lib/const';
import { downloadAsWord, markdownToHtml } from '../lib/download';
import { authFetch } from '../lib/api';

interface ATP {
  id: number;
  title: string;
  grade: string;
  subject: string;
  term: number;
  content: string;
}

// AI Annual Teaching Plan Generator
function generateAnnualTeachingPlan(grade: string, subject: string, term: number): Omit<ATP, 'id'> {
  const termWeeks = term === 1 || term === 3 ? 11 : 10;
  const weeks: { week: number; topic: string; content: string; skills: string; assessment: string; resources: string; time: string }[] = [];

  const topicsBySubject: Record<string, string[]> = {
    'Mathematics': [
      'Number patterns and sequences',
      'Algebraic expressions and equations',
      'Functions and graphs',
      'Geometry and measurement',
      'Trigonometry',
      'Statistics and probability',
      'Financial mathematics',
    ],
    'Physical Sciences': [
      'Matter and materials',
      'Chemical change',
      'Electricity and magnetism',
      'Mechanics',
      'Waves, sound and light',
      'Chemical systems',
    ],
    'Life Sciences': [
      'Life processes in plants and animals',
      'Environmental studies',
      'Human reproduction',
      'Genetics and evolution',
      'Ecology and biodiversity',
    ],
    'Geography': [
      'Map skills and GIS',
      'Climate and weather',
      'Population studies',
      'Economic geography',
      'Resource management',
    ],
    'History': [
      'The world around 1600',
      'Colonisation and resistance',
      'The scramble for Africa',
      'Apartheid and resistance',
      'Democracy and human rights',
    ],
    'English Home Language': [
      'Comprehension and analysis',
      'Writing and presenting',
      'Literature study: novel',
      'Literature study: poetry',
      'Language structures and conventions',
    ],
    'English First Additional Language': [
      'Listening and speaking',
      'Reading and viewing',
      'Writing and presenting',
      'Language structures',
      'Literature study',
    ],
    'Life Orientation': [
      'Development of the self',
      'Social and environmental responsibility',
      'Democracy and human rights',
      'Careers and career choices',
      'Physical education',
    ],
  };

  const subjectTopics = topicsBySubject[subject] || topicsBySubject['Mathematics'];
  const topicsPerWeek = Math.ceil(subjectTopics.length / termWeeks);

  for (let w = 1; w <= termWeeks; w++) {
    const topicIndex = Math.min(Math.floor((w - 1) / Math.max(1, Math.floor(termWeeks / subjectTopics.length))), subjectTopics.length - 1);
    const topic = subjectTopics[Math.min(w - 1, subjectTopics.length - 1)] || `Consolidation Week ${w}`;

    weeks.push({
      week: w,
      topic: topic,
      content: `Introduce and develop understanding of ${topic}. Use CAPS-aligned content and resources. Include practical examples relevant to South African learners.`,
      skills: `Critical thinking, problem-solving, communication, and collaborative learning skills related to ${topic}.`,
      assessment: w === 4 ? 'Test 1 (formative)' : w === 7 ? 'Assignment or project' : w === termWeeks ? 'Exam (summative)' : 'Informal assessment: classwork and homework',
      resources: 'DBE Workbook, textbook, whiteboard, handouts, Siyavula/Mindset Learn resources',
      time: '4.5 hours per week (3 periods x 1.5 hours)',
    });
  }

  // Build content string
  const content = weeks.map((w) =>
    `Week ${w.week}\nTopic: ${w.topic}\nContent: ${w.content}\nSkills: ${w.skills}\nAssessment: ${w.assessment}\nResources: ${w.resources}\nTime Allocation: ${w.time}\n`
  ).join('\n');

  return {
    title: `Annual Teaching Plan - Grade ${grade} ${subject} - Term ${term}`,
    grade,
    subject,
    term,
    content,
  };
}

export default function AnnualTeachingPlan() {
  const [items, setItems] = useState<ATP[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [form, setForm] = useState({
    title: '', grade: '', subject: '', term: 1, content: '',
  });
  const [aiForm, setAiForm] = useState({ grade: '', subject: '', term: 1 });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: ATP = {
      id: Date.now(),
      title: form.title,
      grade: form.grade,
      subject: form.subject,
      term: Number(form.term),
      content: form.content,
    };
    setItems([newItem, ...items]);
    setIsModalOpen(false);
    setForm({ title: '', grade: '', subject: '', term: 1, content: '' });
  };

  const handleAiGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    setTimeout(() => {
      const generated = generateAnnualTeachingPlan(aiForm.grade, aiForm.subject, aiForm.term);
      setForm({
        title: generated.title,
        grade: generated.grade,
        subject: generated.subject,
        term: generated.term,
        content: generated.content,
      });
      setAiLoading(false);
      setIsAiModalOpen(false);
      setIsModalOpen(true);
    }, 1500);
  };

  const handleDownload = (item: ATP) => {
    const htmlContent = `
      <h1>${item.title}</h1>
      <p><strong>Grade:</strong> ${item.grade} | <strong>Subject:</strong> ${item.subject} | <strong>Term:</strong> ${item.term}</p>
      <hr>
      <h2>Annual Teaching Plan</h2>
      ${markdownToHtml(item.content)}
    `;
    downloadAsWord(
      `${item.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.doc`,
      item.title,
      htmlContent
    );
  };

  const filtered = items.filter((i) => {
    if (filterGrade && i.grade !== filterGrade) return false;
    if (filterSubject && i.subject !== filterSubject) return false;
    if (filterTerm && String(i.term) !== filterTerm) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-sand-100 -m-6 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">Annual Teaching Plan (ATP)</h1>
          <p className="text-gray-600 mt-1">Generate week-by-week CAPS-aligned teaching plans for each term.</p>
        </div>
        <button
          onClick={() => setIsAiModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors"
        >
          <Sparkles className="w-4 h-4" />
          AI Generate
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 text-gray-600">
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filters:</span>
        </div>
        <select value={filterGrade} onChange={(e) => setFilterGrade(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
          <option value="">All Grades</option>
          {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
        </select>
        <select value={filterSubject} onChange={(e) => setFilterSubject(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
          <option value="">All Subjects</option>
          {SA_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterTerm} onChange={(e) => setFilterTerm(e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500">
          <option value="">All Terms</option>
          {[1,2,3,4].map((t) => <option key={t} value={t}>Term {t}</option>)}
        </select>
        {(filterGrade || filterSubject || filterTerm) && (
          <button onClick={() => { setFilterGrade(''); setFilterSubject(''); setFilterTerm(''); }} className="text-sm text-teal-700 hover:text-teal-900 underline">Clear filters</button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <CalendarDays className="w-5 h-5 text-teal-700" />
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.title}</h3>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-teal-600" /> Grade {item.grade}</span>
              <span className="text-gray-300">|</span>
              <span>{item.subject}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <CalendarDays className="w-3 h-3" /> Term {item.term}
              </span>
              <button
                onClick={() => handleDownload(item)}
                className="flex items-center gap-1 px-2 py-1 text-xs text-teal-700 bg-teal-50 rounded hover:bg-teal-100 transition-colors"
                title="Download"
              >
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No ATPs found. Use AI Generate to create an Annual Teaching Plan.</p>
        </div>
      )}

      {/* AI Generate Modal */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Annual Teaching Plan Generator">
        <form onSubmit={handleAiGenerate} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Select grade, subject, and term. Our AI will generate a CAPS-aligned Annual Teaching Plan with week-by-week topics, content, skills, and assessments.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select required value={aiForm.grade} onChange={(e) => setAiForm({ ...aiForm, grade: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                <option value="">Select grade</option>
                {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select required value={aiForm.subject} onChange={(e) => setAiForm({ ...aiForm, subject: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                <option value="">Select subject</option>
                {SA_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select value={aiForm.term} onChange={(e) => setAiForm({ ...aiForm, term: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
              {[1,2,3,4].map((t) => <option key={t} value={t}>Term {t}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsAiModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={aiLoading} className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 disabled:opacity-50">
              {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate ATP</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Annual Teaching Plan">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g., Annual Teaching Plan - Grade 10 Mathematics - Term 1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select required value={form.grade} onChange={(e) => setForm({ ...form, grade: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                <option value="">Select grade</option>
                {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                <option value="">Select subject</option>
                {SA_SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
            <select required value={form.term} onChange={(e) => setForm({ ...form, term: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500">
              {[1,2,3,4].map((t) => <option key={t} value={t}>Term {t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Week-by-Week Plan (Content)</label>
            <textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="List each week with topic, content, skills, assessment, and resources..." />
          </div>
          <div className="flex items-center justify-between pt-4">
            <button type="button" onClick={() => setIsAiModalOpen(true)} className="flex items-center gap-2 px-4 py-2 text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100">
              <Sparkles className="w-4 h-4" /> Generate with AI
            </button>
            <div className="flex gap-3">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-gold-500 text-white rounded-lg hover:bg-gold-600">Create</button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
