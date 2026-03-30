import { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen, Download, Loader } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    enrolled: { label: 'En progreso', cls: 'bg-blue-100 text-blue-700' },
    finished: { label: 'Terminado', cls: 'bg-green-100 text-green-700' },
    pending: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
  };
  const { label, cls } = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>;
}

function CourseCard({ enrollment }) {
  const [templateId, setTemplateId] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const course = enrollment.Course || enrollment.course || {};

  useEffect(() => {
    if (enrollment.status === 'finished' && course.id) {
      api.get(`/courses/${course.id}/templates`).then((r) => {
        const tpls = Array.isArray(r.data) ? r.data : (r.data.data || []);
        const diploma = tpls.find((t) => t.type === 'diploma');
        if (diploma) setTemplateId(diploma.id);
      }).catch(() => {});
    }
  }, [enrollment.status, course.id]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await api.get(`/templates/${templateId}/generate/${enrollment.id}`, {
        responseType: 'blob',
      });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `titulo-${course.name || 'curso'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Error al descargar el diploma');
    } finally {
      setDownloading(false);
    }
  };

  const fmt = (d) => d ? new Date(d).toLocaleDateString('es-ES') : '—';

  return (
    <div className="bg-white rounded-xl shadow p-5 flex flex-col gap-3">
      <div className="flex justify-between items-start">
        <div className="p-2 bg-indigo-50 rounded-lg">
          <BookOpen size={20} className="text-indigo-600" />
        </div>
        <StatusBadge status={enrollment.status} />
      </div>
      <div>
        <h3 className="font-semibold text-gray-800">{course.name || '—'}</h3>
        <p className="text-xs text-gray-400 mt-1">
          Inicio: {fmt(enrollment.startDate)}
          {enrollment.endDate && <> · Fin: {fmt(enrollment.endDate)}</>}
        </p>
      </div>
      {enrollment.status === 'finished' && templateId && (
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 mt-auto px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-60 w-fit"
        >
          {downloading ? <Loader size={14} className="animate-spin" /> : <Download size={14} />}
          Descargar título
        </button>
      )}
    </div>
  );
}

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enrollments?limit=100').then((r) => {
      const data = Array.isArray(r.data) ? r.data : (r.data.data || []);
      setEnrollments(data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-400">Cargando...</div>;

  const inProgress = enrollments.filter((e) => e.status === 'enrolled');
  const finished = enrollments.filter((e) => e.status === 'finished');
  const other = enrollments.filter((e) => !['enrolled', 'finished'].includes(e.status));

  const Section = ({ title, items }) =>
    items.length === 0 ? null : (
      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">{title}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((e) => <CourseCard key={e.id} enrollment={e} />)}
        </div>
      </div>
    );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Mis Cursos</h1>
      {enrollments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>No tienes inscripciones</p>
        </div>
      ) : (
        <>
          <Section title="📚 En progreso" items={inProgress} />
          <Section title="✅ Terminados" items={finished} />
          <Section title="Otros" items={other} />
        </>
      )}
    </div>
  );
}
