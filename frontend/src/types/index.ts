export interface Class {
  id: number;
  name: string;
  subject: string;
  grade_level: string;
  created_at: string;
}

export interface Student {
  id: number;
  name: string;
  class_id: number;
  student_number: string;
  created_at: string;
  class_name?: string;
}

export interface Mark {
  id: number;
  student_id: number;
  class_id: number;
  assessment_name: string;
  assessment_type: string;
  marks: number;
  total_marks: number;
  date: string;
  created_at: string;
  student_name?: string;
  class_name?: string;
}

export interface StudyGuide {
  id: number;
  class_id: number | null;
  title: string;
  content: string;
  subject: string;
  created_at: string;
  class_name?: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string;
  class_id: number | null;
  priority: string;
  status: string;
  created_at: string;
  class_name?: string;
}

export interface Attendance {
  id: number;
  student_id: number;
  class_id: number;
  date: string;
  status: string;
  created_at: string;
  student_name?: string;
}

export interface DashboardData {
  stats: {
    classes: number;
    students: number;
    pendingTasks: number;
    studyGuides: number;
  };
  upcomingTasks: Task[];
  recentGuides: StudyGuide[];
}
