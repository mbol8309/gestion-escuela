import { useEffect, useState } from 'react';
import api from '../../services/api';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Enrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState('pending');

  const load = async () => {
    const res = await api.get('/enrollments', { params: { status: filter } });
    setEnrollments(res.data);
  };

  useEffect(() => { load(); }, [filter]);

  const updateStatus = async (id, status) => {
    const notes = status === 'rejected' ? prompt('Motivo del rechazo (opcional):') : '';
    await api.put(`/enrollments/${id}/status`, { status, notes });
    load();
  };

  const statusBadge = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Inscripciones</h1>
        <div className="flex gap-2">
          {['pending', 'approved', 'rejected'].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize ${filter === s ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border hover:bg-gray-50'}`}>
              {s === 'pending' ? 'Pendientes' : s === 'approved' ? 'Aprobadas' : 'Rechazadas'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow divide-y">
        {enrollments.length === 0 && (
          <p className="text-center py-10 text-gray-400">No hay inscripciones {filter === 'pending' ? 'pendientes' : ''}</p>
        )}
        {enrollments.map((e) => (
          <div key={e.id} className="p-4 flex items-center justify-between">
            <div>
              <p className="font-medium">
                {e.Student?.firstName} {e.Student?.lastName}
                <span className="text-gray-400 font-normal ml-2 text-sm">— {e.Student?.email}</span>
              </p>
              <p className="text-sm text-gray-500 mt-0.5">
                {e.CourseEdition?.Course?.name} · Edición {e.CourseEdition?.year}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Solicitada: {new Date(e.requestedAt).toLocaleDateString('es-ES')}
                {e.notes && <span className="ml-2 text-amber-600">· {e.notes}</span>}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge[e.status]}`}>
                {e.status}
              </span>
              {e.status === 'pending' && (
                <>
                  <button onClick={() => updateStatus(e.id, 'approved')}
                    className="flex items-center gap-1 text-green-600 hover:bg-green-50 px-3 py-1.5 rounded-lg text-sm">
                    <CheckCircle size={16} /> Aprobar
                  </button>
                  <button onClick={() => updateStatus(e.id, 'rejected')}
                    className="flex items-center gap-1 text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm">
                    <XCircle size={16} /> Rechazar
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
