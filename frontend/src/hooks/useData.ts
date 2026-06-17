import { useState, useEffect } from 'react';
import { authFetch } from '../lib/api';

export function useClasses() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClasses = async () => {
    const res = await authFetch('/api/classes');
    const data = await res.json();
    setClasses(data);
    setLoading(false);
  };

  useEffect(() => { fetchClasses(); }, []);

  return { classes, loading, refresh: fetchClasses };
}

export function useStudents(classId?: string) {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStudents = async () => {
    const url = classId ? `/api/students?class_id=${classId}` : '/api/students';
    const res = await authFetch(url);
    const data = await res.json();
    setStudents(data);
    setLoading(false);
  };

  useEffect(() => { fetchStudents(); }, [classId]);

  return { students, loading, refresh: fetchStudents };
}

export function useMarks(classId?: string) {
  const [marks, setMarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMarks = async () => {
    const url = classId ? `/api/marks?class_id=${classId}` : '/api/marks';
    const res = await authFetch(url);
    const data = await res.json();
    setMarks(data);
    setLoading(false);
  };

  useEffect(() => { fetchMarks(); }, [classId]);

  return { marks, loading, refresh: fetchMarks };
}

export function useTasks() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const res = await authFetch('/api/tasks');
    const data = await res.json();
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  return { tasks, loading, refresh: fetchTasks };
}

export function useStudyGuides() {
  const [guides, setGuides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGuides = async () => {
    const res = await authFetch('/api/study-guides');
    const data = await res.json();
    setGuides(data);
    setLoading(false);
  };

  useEffect(() => { fetchGuides(); }, []);

  return { guides, loading, refresh: fetchGuides };
}

export function useAttendance(classId?: string, date?: string) {
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = async () => {
    let url = '/api/attendance';
    const params = new URLSearchParams();
    if (classId) params.append('class_id', classId);
    if (date) params.append('date', date);
    if (params.toString()) url += '?' + params.toString();
    const res = await authFetch(url);
    const data = await res.json();
    setAttendance(data);
    setLoading(false);
  };

  useEffect(() => { fetchAttendance(); }, [classId, date]);

  return { attendance, loading, refresh: fetchAttendance };
}

export function useDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    const res = await authFetch('/api/dashboard');
    const data = await res.json();
    setData(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  return { data, loading, refresh: fetchData };
}

export function useReportStudent(studentId: string) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    const res = await authFetch(`/api/reports/student/${studentId}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { if (studentId) fetchReport(); }, [studentId]);

  return { report, loading, refresh: fetchReport };
}

export function useReportClass(classId: string) {
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    const res = await authFetch(`/api/reports/class/${classId}`);
    const data = await res.json();
    setReport(data);
    setLoading(false);
  };

  useEffect(() => { if (classId) fetchReport(); }, [classId]);

  return { report, loading, refresh: fetchReport };
}
