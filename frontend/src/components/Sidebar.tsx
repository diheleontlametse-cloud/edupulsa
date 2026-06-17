import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  GraduationCap,
  CheckSquare,
  CalendarDays,
  School,
  FileText,
  LogOut,
  Calendar,
  Award,
  MessageCircle,
} from 'lucide-react';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/classes', icon: School, label: 'Classes' },
  { to: '/students', icon: Users, label: 'Students' },
  { to: '/study-guides', icon: BookOpen, label: 'Study Guides' },
  { to: '/marks', icon: GraduationCap, label: 'Marks' },
  { to: '/tasks', icon: CheckSquare, label: 'Tasks' },
  { to: '/attendance', icon: CalendarDays, label: 'Attendance' },
  { to: '/reports', icon: FileText, label: 'Reports' },
  { to: '/lesson-plans', icon: FileText, label: 'Lesson Plans' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/rewards', icon: Award, label: 'Rewards' },
  { to: '/chat', icon: MessageCircle, label: 'Chat' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-teal-900 border-r border-teal-800 flex flex-col">
      <div className="p-6 border-b border-teal-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-800 rounded-lg flex items-center justify-center">
            <School className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">EduPlan SA</h1>
            <p className="text-xs text-teal-200">South African Education</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-teal-800 text-white'
                  : 'text-teal-100 hover:bg-teal-800 hover:text-white'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-teal-800 space-y-3">
        <div className="bg-teal-800 rounded-lg p-3">
          <p className="text-xs font-medium text-white mb-1">EduPlan SA Tip</p>
          <p className="text-xs text-teal-100">
            Stay aligned with DBE/CAPS policies. Use CAPS-aligned Study Guides and lesson plans to help learners prepare for NSC exams and CASS tasks.
          </p>
        </div>
        <div className="flex items-center gap-3 px-4">
          <div className="w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-teal-200 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-teal-800 rounded-lg transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
