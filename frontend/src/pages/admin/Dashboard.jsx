import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { Users, Clock, FileEdit, BookOpen } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color, onClick }) {
  return (
    <div
      className={`bg-white rounded-xl shadow p-6 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
      onClick={onClick}
    >
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
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      const [enrolled, pending, draft, courses] = await Promise.all([
        api.get('/students?limit=1&status=enrolled').catch(() => ({ data: { total: 0 } })),
        api.get('/students?limit=1&status=pending').catch(() => ({ data: { total: 0 } })),
        api.get('/students?limit=1&status=draft').catch(() => ({ data: { total: 0 } })),
        api.get('/courses').catch(() => ({ data: [] })),
      ]);
      setStats({
        enrolled: enrolled.data.total,
        pending: pending.data.total,
        draft: draft.data.total,
        courses: Array.isArray(courses.data) ? courses.data.length : 0,
      });
    };
    load();
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Alumnos activos"
          value={stats.enrolled}
          icon={Users}
          color="bg-indigo-500"
          onClick={() => navigate('/admin/alumnos?studentStatus=enrolled')}
        />
        <StatCard
          title="Alumnos pendientes"
          value={stats.pending}
          icon={Clock}
          color="bg-amber-500"
          onClick={() => navigate('/admin/alumnos?studentStatus=pending')}
        />
        <StatCard
          title="Alumnos borrador"
          value={stats.draft}
          icon={FileEdit}
          color="bg-rose-500"
          onClick={() => navigate('/admin/alumnos?studentStatus=draft')}
        />
        <StatCard
          title="Cursos activos"
          value={stats.courses}
          icon={BookOpen}
          color="bg-emerald-500"
        />
      </div>
    </div>
  );
}
