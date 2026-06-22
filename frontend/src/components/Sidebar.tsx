import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRef } from 'react';
import { authFetch } from '../lib/api';
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
  Camera,
  Crown,
  ClipboardCheck,
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
  { to: '/assessments', icon: ClipboardCheck, label: 'Assessments' },
  { to: '/atp', icon: Calendar, label: 'ATP' },
  { to: '/schedule', icon: Calendar, label: 'Schedule' },
  { to: '/rewards', icon: Award, label: 'Rewards' },
  { to: '/subscription', icon: Crown, label: 'Subscription' },
];

export default function Sidebar() {
  const { user, logout, updateUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Image must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      try {
        const res = await authFetch('/api/auth/profile-picture', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, profile_picture: base64 }),
        });
        const data = await res.json();
        if (data.updated > 0) {
          updateUser({ ...user, profile_picture: base64 });
        }
      } catch (err) {
        console.error('Failed to upload profile picture:', err);
      }
    };
    reader.readAsDataURL(file);
  };

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
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover border border-teal-600"
              />
            ) : (
              <div className="w-8 h-8 bg-teal-700 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-3 h-3 text-white" />
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
            <p className="text-xs text-teal-200 truncate">{user?.email}</p>
            {user?.subscription && (
              <p className={`text-xs font-medium mt-0.5 ${
                user.subscription.is_expired ? 'text-red-400' :
                user.subscription.is_trial ? 'text-amber-300' :
                user.subscription.tier === 'pro' ? 'text-gold-300' :
                user.subscription.tier === 'basic' ? 'text-teal-300' :
                'text-teal-200'
              }`}>
                {user.subscription.is_expired ? 'Trial Expired' :
                 user.subscription.is_trial ? `Trial: ${user.subscription.days_left}d left` :
                 user.subscription.tier === 'free' ? 'Free Plan' :
                 user.subscription.tier === 'basic' ? 'Teacher Basic' :
                 user.subscription.tier === 'pro' ? 'Teacher Pro' : 'Free Plan'}
              </p>
            )}
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
