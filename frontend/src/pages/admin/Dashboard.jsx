import { useEffect, useState } from 'react';
import api from '../../services/api';
import { Users, BookOpen, ClipboardList, CheckCircle } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={24} className="text-white" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value ?? '—'}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState({});

  useEffect(() => {
    const load = async () => {
      const [students, courses, enrollments] = await Promise.all([
        api.get('/students?limit=1').catch(() => ({ data: { total: 0 } })),
        api.get('/courses').catch(() => ({ data: [] })),
        api.get('/enrollments').catch(() => ({ data: [] })),
      ]);
      const enrollList = Array.isArray(enrollments.data) ? enrollments.data : [];
      setStats({
        students: students.data.total,
        courses: courses.data.length,
        enrollments: enrollList.length,
        pending: enrollList.filter((e) => e.status === 'pending').length,
      });
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Alumnos" value={stats.students} icon={Users} color="bg-indigo-500" />
        <StatCard title="Cursos activos" value={stats.courses} icon={BookOpen} color="bg-emerald-500" />
        <StatCard title="Inscripciones" value={stats.enrollments} icon={ClipboardList} color="bg-amber-500" />
        <StatCard title="Pendientes" value={stats.pending} icon={CheckCircle} color="bg-rose-500" />
      </div>
    </div>
  );
}
