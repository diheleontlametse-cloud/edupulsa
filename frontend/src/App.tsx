import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Classes from './pages/Classes';
import Students from './pages/Students';
import StudyGuides from './pages/StudyGuides';
import Marks from './pages/Marks';
import Tasks from './pages/Tasks';
import Attendance from './pages/Attendance';
import Reports from './pages/Reports';
import Rewards from './pages/Rewards';
import Schedule from './pages/Schedule';
import LessonPlans from './pages/LessonPlans';
import Chat from './pages/Chat';

export default function App() {
  const { token } = useAuth();

  if (!token) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/students" element={<Students />} />
        <Route path="/study-guides" element={<StudyGuides />} />
        <Route path="/marks" element={<Marks />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/rewards" element={<Rewards />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/lesson-plans" element={<LessonPlans />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
