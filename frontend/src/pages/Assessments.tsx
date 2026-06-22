import { useState } from 'react';
import Modal from '../components/Modal';
import { Filter, ClipboardCheck, Sparkles, Loader2, Download, Calendar, BookOpen } from 'lucide-react';
import { SA_SUBJECTS, GRADES } from '../lib/const';
import { downloadAsWord, markdownToHtml } from '../lib/download';
import { authFetch } from '../lib/api';

interface Assessment {
  id: number;
  title: string;
  grade: string;
  subject: string;
  term: number;
  content: string;
}

// AI Programme of Assessment Generator
function generateProgrammeOfAssessment(grade: string, subject: string, term: number): Omit<Assessment, 'id'> {
  const termWeeks = term === 1 || term === 3 ? 11 : 10;
  const assessments: { name: string; type: string; week: number; marks: number; duration: string; topics: string }[] = [];

  const types = ['Test', 'Assignment', 'Project', 'Oral', 'Practical', 'Exam'];
  const typeForSubject = (t: string) => {
    if (subject === 'Physical Sciences' || subject === 'Life Sciences') return t === 'Practical' ? 'Practical Investigation' : t;
    if (subject === 'English Home Language' || subject === 'English First Additional Language') return t === 'Oral' ? 'Oral Presentation' : t;
    return t;
  };

  // Week 4: Test 1
  assessments.push({
    name: `${subject} Test 1`,
    type: typeForSubject('Test'),
    week: 4,
    marks: 50,
    duration: '1 hour',
    topics: 'Topics covered in weeks 1-4. Focus on foundational concepts and basic application.',
  });

  // Week 7: Assignment/Project
  assessments.push({
    name: `${subject} ${term === 1 || term === 3 ? 'Assignment' : 'Project'}`,
    type: typeForSubject(term === 1 || term === 3 ? 'Assignment' : 'Project'),
    week: 7,
    marks: 100,
    duration: '2 weeks (in-class and homework)',
    topics: 'Research-based task integrating concepts from weeks 1-7. Learners demonstrate understanding through written work and presentation.',
  });

  // Week 9: Test 2
  assessments.push({
    name: `${subject} Test 2`,
    type: typeForSubject('Test'),
    week: 9,
    marks: 50,
    duration: '1 hour',
    topics: 'Topics covered in weeks 5-9. Focus on application and problem-solving.',
  });

  // Week 11 (or 10): Exam
  assessments.push({
    name: `${subject} ${term === 4 ? 'Final Exam' : 'Exam'}`,
    type: typeForSubject('Exam'),
    week: termWeeks,
    marks: 100,
    duration: '2 hours',
    topics: 'Comprehensive assessment covering all topics from the term. Includes knowledge, application, and analysis questions.',
  });

  // Add oral/practical for relevant subjects
  if (subject === 'English Home Language' || subject === 'English First Additional Language') {
    assessments.splice(1, 0, {
      name: `${subject} Oral Assessment`,
      type: 'Oral Presentation',
      week: 5,
      marks: 50,
      duration: '3-5 minutes per learner',
      topics: 'Prepared speech or reading comprehension oral. Assesses pronunciation, fluency, and content understanding.',
    });
  }
  if (subject === 'Physical Sciences' || subject === 'Life Sciences') {
    assessments.splice(1, 0, {
      name: `${subject} Practical Investigation`,
      type: 'Practical Investigation',
      week: 5,
      marks: 50,
      duration: '1 hour practical session',
      topics: 'Laboratory-based investigation. Learners design, conduct, and report on an experiment.',
    });
  }

  // Build content string
  const content = assessments.map((a, i) =>
    `Assessment ${i + 1}: ${a.name}\nType: ${a.type}\nWeek: ${a.week}\nTotal Marks: ${a.marks}\nDuration: ${a.duration}\nTopics Covered: ${a.topics}\n`
  ).join('\n');

  return {
    title: `Programme of Assessment - Grade ${grade} ${subject} - Term ${term}`,
    grade,
    subject,
    term,
    content,
  };
}

export default function Assessments() {
  const [items, setItems] = useState<Assessment[]>([]);
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
    const newItem: Assessment = {
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
      const generated = generateProgrammeOfAssessment(aiForm.grade, aiForm.subject, aiForm.term);
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

  const handleDownload = (item: Assessment) => {
    const htmlContent = `
      <h1>${item.title}</h1>
      <p><strong>Grade:</strong> ${item.grade} | <strong>Subject:</strong> ${item.subject} | <strong>Term:</strong> ${item.term}</p>
      <hr>
      <h2>Programme of Assessment</h2>
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
          <h1 className="text-2xl font-bold text-teal-900">Programme of Assessment</h1>
          <p className="text-gray-600 mt-1">Generate and manage CAPS-aligned assessment schedules for each term.</p>
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
              <ClipboardCheck className="w-5 h-5 text-teal-700" />
              <h3 className="font-semibold text-gray-900 text-sm leading-tight">{item.title}</h3>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
              <span className="flex items-center gap-1"><BookOpen className="w-4 h-4 text-teal-600" /> Grade {item.grade}</span>
              <span className="text-gray-300">|</span>
              <span>{item.subject}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Calendar className="w-3 h-3" /> Term {item.term}
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
          <ClipboardCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No assessments found. Use AI Generate to create a Programme of Assessment.</p>
        </div>
      )}

      {/* AI Generate Modal */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Programme of Assessment Generator">
        <form onSubmit={handleAiGenerate} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Select grade, subject, and term. Our AI will generate a CAPS-aligned Programme of Assessment with tests, assignments, projects, and exams.
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
              {aiLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><Sparkles className="w-4 h-4" /> Generate Assessment</>}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Programme of Assessment">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="e.g., Programme of Assessment - Grade 10 Mathematics - Term 1" />
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment Schedule (Content)</label>
            <textarea rows={10} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500" placeholder="List each assessment with type, week, marks, duration, and topics..." />
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
