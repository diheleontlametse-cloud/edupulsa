import { useState } from 'react';
import Modal from '../components/Modal';
import { Filter, BookOpen, Clock, FileText, Wand2, Sparkles, Loader2 } from 'lucide-react';
import { SA_SUBJECTS, GRADES } from '../lib/const';

interface LessonPlan {
  id: number;
  title: string;
  grade: string;
  subject: string;
  topic: string;
  duration: number;
  term: number;
  week: number;
  status: 'Draft' | 'Published';
  learningOutcomes: string;
  materials: string;
  introduction: string;
  body: string;
  conclusion: string;
  assessment: string;
  homework: string;
}

const mockPlans: LessonPlan[] = [
  {
    id: 1,
    title: 'Introduction to Quadratic Equations',
    grade: '10',
    subject: 'Mathematics',
    topic: 'Algebra',
    duration: 60,
    term: 2,
    week: 4,
    status: 'Published',
    learningOutcomes: 'Understand the form ax² + bx + c = 0. Identify coefficients and apply the quadratic formula.',
    materials: 'Whiteboard, DBE worksheets, calculators, Siyavula app access',
    introduction: 'Recap linear equations. Present a real-world problem: "A ball is thrown upward. Its height h after t seconds is h = -5t² + 20t + 10. How long until it hits the ground?" This introduces the need for quadratic equations.',
    body: '1. Define quadratic equation: ax² + bx + c = 0.\n2. Identify a, b, c in examples.\n3. Teach factorising (when a=1).\n4. Introduce the quadratic formula: x = (-b ± √(b²-4ac)) / 2a.\n5. Work through 3 examples on the board.\n6. Learners practice in pairs with DBE Workbook Exercise 5.1.\n7. Discuss the discriminant (b²-4ac) and what it tells us about roots.',
    conclusion: 'Summarise the 3 methods: factorising, quadratic formula, completing the square. Highlight common mistakes: forgetting ±, sign errors with -b. Quick exit ticket: solve x² - 5x + 6 = 0.',
    assessment: 'Exit ticket: 3 problems (factorise, use formula, interpret discriminant). Peer marking.',
    homework: 'DBE Workbook Exercise 5.2, questions 1-8. Research: Find a real-world example of a parabola in your community.',
  },
  {
    id: 2,
    title: 'Cell Structure and Function',
    grade: '11',
    subject: 'Life Sciences',
    topic: 'Cells',
    duration: 90,
    term: 1,
    week: 2,
    status: 'Draft',
    learningOutcomes: 'Identify organelles and their functions. Compare plant and animal cells.',
    materials: 'Microscopes, prepared slides, cell diagrams, posters, Mindset Learn video',
    introduction: 'Discuss cell theory: all living things are made of cells. Show the Mindset Learn video on cell structure. Ask: "What do you think is inside a cell?" Brainstorm.',
    body: '1. Distribute cell diagrams.\n2. Identify organelles: nucleus, mitochondria, ribosomes, ER, Golgi, lysosomes, vacuole, cell wall, chloroplasts.\n3. Function matching activity: learners match organelle to function.\n4. Practical: View plant and animal cells under microscopes.\n5. Record observations in lab books.\n6. Class discussion: Compare plant vs animal cells.',
    conclusion: 'Create a Venn diagram on the board: Plant cells only, Both, Animal cells only. Discuss why each cell type has specific structures.',
    assessment: 'Labelled diagram quiz. Microscope drawing rubric.',
    homework: 'Research one organelle in depth. Prepare a 1-minute presentation for next class.',
  },
  {
    id: 3,
    title: 'Map Skills: Scale and Distance',
    grade: '8',
    subject: 'Geography',
    topic: 'Map Work',
    duration: 45,
    term: 3,
    week: 1,
    status: 'Published',
    learningOutcomes: 'Calculate real distance using map scale. Convert between different scale types.',
    materials: 'Topographic maps of local area, rulers, calculators, string for curved distances',
    introduction: 'Show a map of your local town. Ask: "How far is it from the school to the nearest shop?" Discuss that maps show things smaller than real life.',
    body: '1. Review scale types: statement (1cm to 1km), representative fraction (1:50,000), linear.\n2. Demonstrate measuring straight-line distance with ruler.\n3. Demonstrate measuring curved distance with string.\n4. Conversion practice: cm → km using scale.\n5. Worksheet: 5 local map problems.\n6. Group challenge: Plan the shortest route between 3 landmarks.',
    conclusion: 'Discuss real-world applications: hiking, road trips, emergency services. Link to GPS and Google Maps.',
    assessment: 'Worksheet with 5 scale problems. Group route challenge presentation.',
    homework: 'Bring a map from home (brochure, GPS screenshot, or hand-drawn). Measure one distance and write the scale.',
  },
];

// AI Lesson Plan Generator Templates
function generateLessonPlan(grade: string, subject: string, topic: string, duration: number): Omit<LessonPlan, 'id' | 'status'> {
  const gradeNum = parseInt(grade) || 0;
  // Determine grade phase for context-aware generation
  const phase = gradeNum <= 3 ? 'Foundation' : gradeNum <= 6 ? 'Intermediate' : 'Senior/FET';

  // Learning outcomes based on subject and grade
  const outcomes: Record<string, string[]> = {
    'Mathematics': [
      'Understand and apply the concept of {topic} in problem-solving contexts.',
      'Use appropriate mathematical language and notation when discussing {topic}.',
      'Solve real-world problems involving {topic} with accuracy.',
    ],
    'Mathematical Literacy': [
      'Interpret and analyse real-world scenarios involving {topic}.',
      'Apply numerical and spatial skills to practical problems.',
      'Communicate mathematical reasoning clearly and logically.',
    ],
    'Physical Sciences': [
      'Explain the principles of {topic} using scientific terminology.',
      'Apply knowledge of {topic} to solve quantitative problems.',
      'Conduct investigations and analyse data related to {topic}.',
    ],
    'Life Sciences': [
      'Describe the structure and function related to {topic}.',
      'Analyse the relationship between {topic} and living systems.',
      'Evaluate the importance of {topic} in everyday life.',
    ],
    'Geography': [
      'Interpret and use geographical skills related to {topic}.',
      'Analyse spatial patterns and processes involving {topic}.',
      'Apply knowledge of {topic} to local South African contexts.',
    ],
    'History': [
      'Analyse historical sources related to {topic}.',
      'Evaluate different perspectives on {topic}.',
      'Understand the cause and effect of events related to {topic}.',
    ],
    'English Home Language': [
      'Comprehend and analyse texts related to {topic}.',
      'Express ideas about {topic} using appropriate language structures.',
      'Apply language skills in creative and critical contexts.',
    ],
    'English First Additional Language': [
      'Develop vocabulary and comprehension skills related to {topic}.',
      'Communicate ideas about {topic} in spoken and written form.',
      'Use language learning strategies to engage with {topic}.',
    ],
    'Life Orientation': [
      'Develop self-awareness and decision-making skills related to {topic}.',
      'Apply knowledge of {topic} to personal and social contexts.',
      'Demonstrate responsible citizenship through understanding {topic}.',
    ],
  };

  const subjectOutcomes = outcomes[subject] || outcomes['Mathematics'];
  const learningOutcomes = subjectOutcomes.map(o => o.replace('{topic}', topic)).join('\n');

  // Materials based on subject
  const materialsMap: Record<string, string> = {
    'Mathematics': 'DBE Workbook, whiteboard, calculators, Siyavula app, worksheets, rulers',
    'Mathematical Literacy': 'Newspapers, adverts, DBE worksheets, calculators, real-world data sets',
    'Physical Sciences': 'Lab equipment, safety gear, DBE practical manual, data loggers, posters',
    'Life Sciences': 'Microscopes, slides, specimens, diagrams, DBE workbook, Mindset Learn video',
    'Geography': 'Topographic maps, atlases, GIS software access, photos, DBE atlas',
    'History': 'Primary sources, textbook, DBE workbook, video clips, newspaper articles',
    'English Home Language': 'Novel/poem extracts, DBE anthology, writing materials, audio recordings',
    'English First Additional Language': 'Graded readers, DBE workbook, flashcards, audio recordings',
    'Life Orientation': 'DBE workbook, case studies, posters, worksheets, guest speaker materials',
  };

  const materials = materialsMap[subject] || 'DBE Workbook, whiteboard, projector, handouts';

  // Introduction template
  const introduction = `**Hook (5 min):** Present a relatable scenario or question that connects ${topic} to learners' daily lives in South Africa.\n\n**Prior Knowledge (5 min):** Briefly recap what learners already know that connects to ${topic}. Use a think-pair-share activity.\n\n**Learning Intentions (2 min):** Share what learners will be able to do by the end of the lesson. Write the outcomes on the board.`;

  // Body template based on duration
  const bodyMinutes = duration - 15; // minus intro and conclusion
  const activityTime = Math.floor(bodyMinutes / 3);

  const body = `**Direct Instruction (${activityTime} min):**\n- Present key concepts of ${topic} using clear explanations and visual aids appropriate for ${phase} learners.\n- Model worked examples on the board.\n- Check for understanding with strategic questions.\n\n**Guided Practice (${activityTime} min):**\n- Learners work in pairs or small groups on structured problems related to ${topic}.\n- Teacher circulates, provides feedback, and addresses misconceptions.\n- Use DBE workbook exercises or customised worksheets.\n\n**Independent Practice (${activityTime} min):**\n- Learners complete individual tasks to consolidate understanding of ${topic}.\n- Differentiated tasks: Extension for fast finishers, support for those who need it.\n- Peer marking where appropriate.`;

  // Conclusion
  const conclusion = `**Plenary (5 min):**\n- Summarise key learning points about ${topic}.\n- Ask 3 learners to share one thing they learned.\n- Connect to next lesson: preview what comes next.\n\n**Exit Ticket (5 min):**\nQuick assessment: One question that checks understanding of the core concept from ${topic}.`;

  // Assessment
  const assessment = `**Formative Assessment (during lesson):**\n- Observation of participation during guided practice.\n- Questioning throughout the lesson.\n- Peer marking of practice exercises.\n\n**Summative Assessment (exit ticket):**\n- One question that assesses the core learning outcome for ${topic}.\n- Self-assessment: learners rate their confidence (1-5) on the learning intention.`;

  // Homework
  const homework = `**DBE Workbook:** Complete the exercises related to ${topic}.\n\n**Extension (optional):** Find a real-world example of ${topic} in your community or in a South African context. Write 3 sentences explaining the connection.\n\n**Preparation for next lesson:** Read ahead about the next topic and write one question you have.`;

  return {
    title: `${topic} - Grade ${grade} ${subject}`,
    grade,
    subject,
    topic,
    duration,
    term: 1,
    week: 1,
    learningOutcomes,
    materials,
    introduction,
    body,
    conclusion,
    assessment,
    homework,
  };
}

export default function LessonPlans() {
  const [plans, setPlans] = useState<LessonPlan[]>(mockPlans);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [filterGrade, setFilterGrade] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterTerm, setFilterTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [form, setForm] = useState({
    title: '',
    grade: '',
    subject: '',
    topic: '',
    duration: 60,
    term: 1,
    week: 1,
    learningOutcomes: '',
    materials: '',
    introduction: '',
    body: '',
    conclusion: '',
    assessment: '',
    homework: '',
  });
  const [aiForm, setAiForm] = useState({
    grade: '',
    subject: '',
    topic: '',
    duration: 60,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newPlan: LessonPlan = {
      id: Date.now(),
      title: form.title,
      grade: form.grade,
      subject: form.subject,
      topic: form.topic,
      duration: Number(form.duration),
      term: Number(form.term),
      week: Number(form.week),
      status: 'Draft',
      learningOutcomes: form.learningOutcomes,
      materials: form.materials,
      introduction: form.introduction,
      body: form.body,
      conclusion: form.conclusion,
      assessment: form.assessment,
      homework: form.homework,
    };
    setPlans([newPlan, ...plans]);
    setIsModalOpen(false);
    setForm({
      title: '', grade: '', subject: '', topic: '', duration: 60, term: 1, week: 1,
      learningOutcomes: '', materials: '', introduction: '', body: '', conclusion: '', assessment: '', homework: '',
    });
  };

  const handleAiGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    setAiLoading(true);
    // Simulate AI processing
    setTimeout(() => {
      const generated = generateLessonPlan(aiForm.grade, aiForm.subject, aiForm.topic, aiForm.duration);
      setForm({
        title: generated.title,
        grade: generated.grade,
        subject: generated.subject,
        topic: generated.topic,
        duration: generated.duration,
        term: generated.term,
        week: generated.week,
        learningOutcomes: generated.learningOutcomes,
        materials: generated.materials,
        introduction: generated.introduction,
        body: generated.body,
        conclusion: generated.conclusion,
        assessment: generated.assessment,
        homework: generated.homework,
      });
      setAiLoading(false);
      setIsAiModalOpen(false);
      setIsModalOpen(true);
    }, 1500);
  };

  const filtered = plans.filter((p) => {
    if (filterGrade && p.grade !== filterGrade) return false;
    if (filterSubject && p.subject !== filterSubject) return false;
    if (filterTerm && String(p.term) !== filterTerm) return false;
    if (filterStatus && p.status !== filterStatus) return false;
    return true;
  });

  return (
    <div className="min-h-full bg-sand-100 -m-6 p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-teal-900">Lesson Plans</h1>
          <p className="text-gray-600 mt-1">Create, manage, and organise your CAPS-aligned lesson plans by grade and subject.</p>
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
        <select
          value={filterGrade}
          onChange={(e) => setFilterGrade(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">All Grades</option>
          {GRADES.map((g) => (
            <option key={g} value={g}>Grade {g}</option>
          ))}
        </select>
        <select
          value={filterSubject}
          onChange={(e) => setFilterSubject(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">All Subjects</option>
          {SA_SUBJECTS.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select
          value={filterTerm}
          onChange={(e) => setFilterTerm(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">All Terms</option>
          <option value="1">Term 1</option>
          <option value="2">Term 2</option>
          <option value="3">Term 3</option>
          <option value="4">Term 4</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="">All Status</option>
          <option value="Draft">Draft</option>
          <option value="Published">Published</option>
        </select>
        {(filterGrade || filterSubject || filterTerm || filterStatus) && (
          <button
            onClick={() => { setFilterGrade(''); setFilterSubject(''); setFilterTerm(''); setFilterStatus(''); }}
            className="text-sm text-teal-700 hover:text-teal-900 underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((plan) => (
          <div key={plan.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                plan.status === 'Published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}>
                {plan.status}
              </span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                {plan.duration} min
              </span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{plan.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{plan.topic}</p>
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <BookOpen className="w-4 h-4 text-teal-600" />
                Grade {plan.grade}
              </span>
              <span className="text-gray-300">|</span>
              <span>{plan.subject}</span>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <FileText className="w-3 h-3" />
              Term {plan.term}, Week {plan.week}
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No lesson plans match your filters. Try adjusting them or create a new plan.</p>
        </div>
      )}

      {/* AI Generate Modal */}
      <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Lesson Plan Generator">
        <form onSubmit={handleAiGenerate} className="space-y-4">
          <p className="text-sm text-gray-600 mb-4">
            Enter your grade, subject, and topic. Our AI will generate a CAPS-aligned lesson plan with learning outcomes, activities, and assessment strategies.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
              <select
                required
                value={aiForm.grade}
                onChange={(e) => setAiForm({ ...aiForm, grade: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Select grade</option>
                {GRADES.map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                required
                value={aiForm.subject}
                onChange={(e) => setAiForm({ ...aiForm, subject: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="">Select subject</option>
                {SA_SUBJECTS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              required
              value={aiForm.topic}
              onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Photosynthesis, Quadratic Equations, Map Skills"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
            <select
              value={aiForm.duration}
              onChange={(e) => setAiForm({ ...aiForm, duration: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <option value={45}>45 minutes (1 period)</option>
              <option value={60}>60 minutes (double period)</option>
              <option value={90}>90 minutes (extended)</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(false)}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={aiLoading}
              className="flex items-center gap-2 px-4 py-2 bg-teal-800 text-white rounded-lg hover:bg-teal-900 transition-colors disabled:opacity-50"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  Generate Lesson Plan
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create Lesson Plan">
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Introduction to Photosynthesis"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Topic</label>
            <input
              type="text"
              required
              value={form.topic}
              onChange={(e) => setForm({ ...form, topic: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., Photosynthesis"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
              <input
                type="number"
                min={30}
                max={90}
                required
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Term</label>
              <select
                required
                value={form.term}
                onChange={(e) => setForm({ ...form, term: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {[1, 2, 3, 4].map((t) => (
                  <option key={t} value={t}>Term {t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week</label>
              <select
                required
                value={form.week}
                onChange={(e) => setForm({ ...form, week: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((w) => (
                  <option key={w} value={w}>Week {w}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Learning Outcomes</label>
            <textarea
              rows={3}
              value={form.learningOutcomes}
              onChange={(e) => setForm({ ...form, learningOutcomes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="What should learners be able to do?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Materials Needed</label>
            <textarea
              rows={2}
              value={form.materials}
              onChange={(e) => setForm({ ...form, materials: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="e.g., whiteboard, DBE workbook, calculators"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Introduction</label>
            <textarea
              rows={3}
              value={form.introduction}
              onChange={(e) => setForm({ ...form, introduction: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="How will you introduce the topic?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Body / Main Activity</label>
            <textarea
              rows={4}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Describe the main lesson activities..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Conclusion</label>
            <textarea
              rows={3}
              value={form.conclusion}
              onChange={(e) => setForm({ ...form, conclusion: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="How will you wrap up the lesson?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Assessment</label>
            <textarea
              rows={3}
              value={form.assessment}
              onChange={(e) => setForm({ ...form, assessment: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="How will you assess understanding?"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Homework</label>
            <textarea
              rows={2}
              value={form.homework}
              onChange={(e) => setForm({ ...form, homework: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="What homework will you assign?"
            />
          </div>
          <div className="flex items-center justify-between pt-4">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
            >
              <Wand2 className="w-4 h-4" />
              Generate with AI
            </button>
            <div className="flex gap-3">
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
                Create
              </button>
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
