import { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen } from 'lucide-react';

const statusBadge = {
  pending: 'bg-yellow-100 text-yellow-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function MyCourses() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/enrollments').then((r) => {
      setEnrollments(r.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="text-center py-10 text-gray-400">Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mis Cursos</h1>
      {enrollments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
          <p>No tienes inscripciones</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((e) => (
            <div key={e.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <BookOpen size={20} className="text-indigo-600" />
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge[e.status]}`}>
                  {e.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-800">{e.CourseEdition?.Course?.name}</h3>
              <p className="text-sm text-gray-500 mt-1">Edición {e.CourseEdition?.year}</p>
              <p className="text-xs text-gray-400 mt-3">
                Inscrito el {new Date(e.requestedAt).toLocaleDateString('es-ES')}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
