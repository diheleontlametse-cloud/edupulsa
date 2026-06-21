import { useDashboard } from '../hooks/useData';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  School,
  Users,
  CheckSquare,
  BookOpen,
  Clock,
  ArrowRight,
  TrendingUp,
  Quote,
  Crown,
  AlertTriangle,
} from 'lucide-react';

export default function Dashboard() {
  const { data, loading } = useDashboard();
  const { user } = useAuth();
  const navigate = useNavigate();

  const sub = user?.subscription;
  const isTrial = sub?.is_trial;
  const isExpired = sub?.is_expired;
  const daysLeft = sub?.days_left || 0;
  const tier = sub?.tier || 'free';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-800"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Classes', value: data?.stats.classes || 0, icon: School, color: 'bg-teal-50 text-teal-800' },
    { label: 'Students', value: data?.stats.students || 0, icon: Users, color: 'bg-green-50 text-green-700' },
    { label: 'Pending Tasks', value: data?.stats.pendingTasks || 0, icon: CheckSquare, color: 'bg-amber-50 text-amber-700' },
    { label: 'Study Guides', value: data?.stats.studyGuides || 0, icon: BookOpen, color: 'bg-gold-100 text-gold-600' },
  ];

  const dailyQuotes = [
    "Education is the most powerful weapon which you can use to change the world. — Nelson Mandela",
    "The youth of today are the leaders of tomorrow. — Nelson Mandela",
    "A good head and good heart are always a formidable combination. — Nelson Mandela",
  ];
  const quote = dailyQuotes[new Date().getDate() % dailyQuotes.length];

  return (
    <div className="space-y-6">
      {/* Subscription Banner */}
      {(isTrial || isExpired) && (
        <div className={`rounded-xl p-4 border ${isExpired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isExpired ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <Crown className="w-5 h-5 text-amber-600" />
              )}
              <div>
                <p className={`font-medium ${isExpired ? 'text-red-800' : 'text-amber-800'}`}>
                  {isExpired
                    ? 'Your free trial has expired'
                    : `Free trial: ${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                </p>
                <p className={`text-sm ${isExpired ? 'text-red-600' : 'text-amber-700'}`}>
                  {isExpired
                    ? 'Upgrade to continue using all features.'
                    : 'Upgrade anytime to keep full access after your trial.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/subscription')}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${
                isExpired ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              {isExpired ? 'Upgrade Now' : 'View Plans'}
            </button>
          </div>
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome to EduPlan SA</h1>
        <p className="text-gray-500 mt-1">Your CAPS-aligned dashboard for South African classrooms.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-teal-800" />
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h2>
            </div>
          </div>
          <div className="p-6">
            {data?.upcomingTasks?.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming tasks. You're all caught up!</p>
            ) : (
              <div className="space-y-3">
                {data?.upcomingTasks?.map((task: any) => (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{task.title}</p>
                      <p className="text-sm text-gray-500">Due: {new Date(task.due_date).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-800" />
              <h2 className="text-lg font-semibold text-gray-900">Recent Study Guides</h2>
            </div>
          </div>
          <div className="p-6">
            {data?.recentGuides?.length === 0 ? (
              <p className="text-gray-500 text-sm">No study guides created yet.</p>
            ) : (
              <div className="space-y-3">
                {data?.recentGuides?.map((guide: any) => (
                  <div key={guide.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{guide.title}</p>
                      <p className="text-sm text-gray-500">{guide.subject}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <Quote className="w-5 h-5 text-gold-500" />
          <h2 className="text-lg font-semibold text-gray-900">Daily Quote</h2>
        </div>
        <p className="text-gray-700 italic">{quote}</p>
      </div>
    </div>
  );
}
