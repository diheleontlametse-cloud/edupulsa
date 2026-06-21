import { useState } from 'react';
import { useStudyGuides, useClasses } from '../hooks/useData';
import { authFetch } from '../lib/api';
import Modal from '../components/Modal';
import { Plus, Pencil, Trash2, BookOpen, Wand2, Download } from 'lucide-react';
import { downloadAsWord, markdownToHtml } from '../lib/download';

const studyGuideTemplates = {
  'exam_review': {
    title: 'CAPS Exam Review Guide',
    content: `CAPS Exam Review: {{topic}}

Key Concepts (CAPS Aligned)
1. 
2. 
3. 

Important Definitions & Terminology
- Definition 1: 
- Definition 2: 

Practice Questions (Exam Style)
1. 
2. 
3. 

Study Tips for South African Learners
- Review DBE (Department of Basic Education) workbooks
- Practice past NSC/CAPS exam papers (2010–2024)
- Study for 45 minutes, then take a 15-minute break
- Use Siyavula or Mindset Learn for extra practice

Resources
- DBE Workbook Chapter: 
- Siyavula / Mindset Learn: 
- Past Exam Paper: 
`
  },
  'chapter_summary': {
    title: 'CAPS Chapter Summary',
    content: `CAPS Chapter Summary: {{topic}}

Main Ideas (Aligned to CAPS Document)

- 


Vocabulary (English + Multilingual)





Questions to Consider
1. 
2. 

Connections to Prior Learning
How does this connect to previous grades (CAPS progression)?

Homework Checklist
Read the DBE-approved textbook chapter
Complete CAPS-aligned exercises
Review vocabulary in home language
Attempt one past exam question
`
  },
  'revision_notes': {
    title: 'CAPS Revision Notes',
    content: `CAPS Revision Notes: {{topic}}

Quick Facts (DBE Aligned)

- 


Formulas / Rules to Remember


Common Mistakes (CAPS Examiner Reports)
1. 
2. 

Self-Test (CASS / SBA Style)
1. Question: 
   Answer: 

2. Question: 
   Answer: 

Next Steps
Create flashcards
Teach a friend (peer learning)
Complete CASS task
Review DBE exam guidelines
`
  },
  'lesson_plan': {
    title: 'CAPS Lesson Plan',
    content: `CAPS Lesson Plan: {{topic}}

Lesson Overview
- Grade: 
- Subject: 
- Duration: 45 minutes (1 CAPS period)
- Topic: {{topic}}

Learning Outcomes (CAPS)
By the end of this lesson, learners should be able to:
1. 
2. 
3. 

Assessment Criteria (CASS / SBA)
- Knowledge & Understanding: 
- Application: 
- Analysis & Evaluation: 

Teaching Activities
 Time  Activity  Method 
------------------------
 10 min  Introduction / Hook  Discussion 
 15 min  Direct Instruction  Explanation 
 15 min  Guided Practice  Group Work 
 5 min  Exit Ticket / Plenary  Individual 

Resources Needed
- DBE Workbook
- Chalkboard / Whiteboard
- Handouts
- Mindset Learn video (optional)

Homework / Extension


Multilingual Support
- Key terms in isiZulu: 
- Key terms in Afrikaans: 
`
  }
};

export default function StudyGuides() {
  const { guides, loading, refresh } = useStudyGuides();
  const { classes } = useClasses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ title: '', content: '', subject: '', class_id: '' });
  const [generateForm, setGenerateForm] = useState({ topic: '', subject: '', template: 'exam_review', class_id: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...form, class_id: form.class_id ? Number(form.class_id) : null };
    if (editing) {
      await authFetch(`/api/study-guides/${editing.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await authFetch('/api/study-guides', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setIsModalOpen(false);
    setEditing(null);
    setForm({ title: '', content: '', subject: '', class_id: '' });
    refresh();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    const template = studyGuideTemplates[generateForm.template as keyof typeof studyGuideTemplates];
    const content = template.content.replace(/\{\{topic\}\}/g, generateForm.topic);
    const title = `${template.title}: ${generateForm.topic}`;
    await authFetch('/api/study-guides', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        content,
        subject: generateForm.subject,
        class_id: generateForm.class_id ? Number(generateForm.class_id) : null,
      }),
    });
    setIsGenerateOpen(false);
    setGenerateForm({ topic: '', subject: '', template: 'exam_review', class_id: '' });
    refresh();
  };

  const handleEdit = (guide: any) => {
    setEditing(guide);
    setForm({
      title: guide.title,
      content: guide.content,
      subject: guide.subject,
      class_id: guide.class_id ? String(guide.class_id) : '',
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure?')) return;
    await authFetch(`/api/study-guides/${id}`, { method: 'DELETE' });
    refresh();
  };

  const handleDownload = (guide: any) => {
    const htmlContent = `
      <h1>${guide.title}</h1>
      <p><strong>Subject:</strong> ${guide.subject}</p>
      ${guide.class_name ? `<p><strong>Class:</strong> ${guide.class_name}</p>` : ''}
      <hr>
      ${markdownToHtml(guide.content)}
    `;
    downloadAsWord(
      `${guide.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_study_guide.doc`,
      guide.title,
      htmlContent
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Study Guides</h1>
          <p className="text-gray-500 mt-1">Create and manage CAPS-aligned study guides for your learners.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsGenerateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Wand2 className="w-4 h-4" />
            Generate
          </button>
          <button
            onClick={() => { setEditing(null); setForm({ title: '', content: '', subject: '', class_id: '' }); setIsModalOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Guide
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {guides.map((guide: any) => (
          <div key={guide.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="p-2 bg-purple-50 rounded-lg">
                <BookOpen className="w-5 h-5 text-purple-600" />
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDownload(guide)} className="p-2 hover:bg-green-50 rounded-lg transition-colors" title="Download">
                  <Download className="w-4 h-4 text-green-600" />
                </button>
                <button onClick={() => handleEdit(guide)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <Pencil className="w-4 h-4 text-gray-500" />
                </button>
                <button onClick={() => handleDelete(guide.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{guide.title}</h3>
            <p className="text-sm text-purple-600 mb-2">{guide.subject}</p>
            {guide.class_name && (
              <span className="text-xs text-gray-500 mb-3">For: {guide.class_name}</span>
            )}
            <div className="mt-auto pt-4">
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans">{guide.content}</pre>
              </div>
            </div>
          </div>
        ))}
      </div>

      {guides.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No study guides yet. Generate or create your first one.</p>
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editing ? 'Edit Study Guide' : 'Add Study Guide'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (optional)</label>
            <select
              value={form.class_id}
              onChange={(e) => setForm({ ...form, class_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            >
              <option value="">All Classes</option>
              {classes.map((c: any) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              required
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600 font-mono text-sm"
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

      {/* Generate Modal */}
      <Modal isOpen={isGenerateOpen} onClose={() => setIsGenerateOpen(false)} title="Generate Study Guide">
        <form onSubmit={handleGenerate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              required
              value={generateForm.topic}
              onChange={(e) => setGenerateForm({ ...generateForm, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="e.g., Photosynthesis"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input
              type="text"
              required
              value={generateForm.subject}
              onChange={(e) => setGenerateForm({ ...generateForm, subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
              placeholder="e.g., Biology"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Template</label>
            <select
              value={generateForm.template}
              onChange={(e) => setGenerateForm({ ...generateForm, template: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            >
              <option value="exam_review">CAPS Exam Review Guide</option>
              <option value="chapter_summary">CAPS Chapter Summary</option>
              <option value="revision_notes">CAPS Revision Notes</option>
              <option value="lesson_plan">CAPS Lesson Plan</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Class (optional)</label>
            <select
              value={generateForm.class_id}
              onChange={(e) => setGenerateForm({ ...generateForm, class_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
            >
              <option value="">All Classes</option>
              {classes.map((c: any) => (
                <option key={c.id} value={String(c.id)}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setIsGenerateOpen(false)} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
              Generate
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
