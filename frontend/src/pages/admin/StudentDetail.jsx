import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import api from '../../services/api';
import { ArrowLeft, Pencil, X, Download } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    enrolled: { label: 'Matriculado', cls: 'bg-green-100 text-green-700' },
    pending: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
    finished: { label: 'Finalizado', cls: 'bg-blue-100 text-blue-700' },
    rejected: { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
    // legacy
    completed: { label: 'Completado', cls: 'bg-green-100 text-green-700' },
    active: { label: 'En curso', cls: 'bg-yellow-100 text-yellow-700' },
    approved: { label: 'Aprobado', cls: 'bg-green-100 text-green-700' },
  };
  const s = map[status] || { label: status, cls: 'bg-gray-100 text-gray-600' };
  return <span className={`px-2 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

function DiplomaModal({ enrollment, onClose }) {
  const courseId = enrollment.courseId || enrollment.CourseEdition?.courseId || enrollment.Course?.id;
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates', courseId],
    queryFn: () => courseId ? api.get(`/courses/${courseId}/templates`).then((r) => r.data) : [],
    enabled: !!courseId,
  });

  const downloadDiploma = (templateId) => {
    const url = `/api/templates/${templateId}/generate/${enrollment.id}`;
    window.open(url, '_blank');
  };

  return (
    <Modal title="Generar diploma" onClose={onClose}>
      {isLoading ? (
        <p className="text-gray-400 text-sm text-center py-4">Cargando plantillas...</p>
      ) : templates.filter((t) => t.type === 'diploma').length === 0 ? (
        <p className="text-gray-400 text-sm text-center py-6">
          No hay plantillas de diploma para este curso.<br />
          Puedes añadir una desde el detalle del curso.
        </p>
      ) : (
        <div className="space-y-2">
          {templates.filter((t) => t.type === 'diploma').map((t) => (
            <button
              key={t.id}
              onClick={() => downloadDiploma(t.id)}
              className="w-full flex items-center gap-3 border rounded-lg px-4 py-3 hover:bg-indigo-50 hover:border-indigo-300 text-left"
            >
              <Download size={16} className="text-indigo-500 flex-shrink-0" />
              <span className="text-sm font-medium">{t.name}</span>
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [diplomaEnrollment, setDiplomaEnrollment] = useState(null);

  const prevSearch = location.state?.searchParams || '';

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get(`/students/${id}`).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const finishMutation = useMutation({
    mutationFn: (enrollmentId) => api.put(`/enrollments/${enrollmentId}/finish`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['student', id] }),
  });

  const openEdit = () => {
    reset({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      dni: student.dni || '',
      phone: student.phone || '',
    });
    setShowEdit(true);
  };

  const onSubmit = async (formData) => {
    await api.put(`/students/${id}`, formData);
    setShowEdit(false);
    queryClient.invalidateQueries({ queryKey: ['student', id] });
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  const goBack = () => {
    navigate(`/admin/alumnos${prevSearch ? '?' + prevSearch : ''}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !student) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg mb-4">Alumno no encontrado</p>
        <button onClick={goBack} className="text-indigo-600 hover:underline flex items-center gap-1 mx-auto">
          <ArrowLeft size={16} /> Volver a alumnos
        </button>
      </div>
    );
  }

  const enrollments = student.Enrollments || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={goBack} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
          <ArrowLeft size={16} /> Volver a alumnos
        </button>
      </div>

      {/* Header card */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>{student.email}</p>
              {student.dni && <p>DNI: {student.dni}</p>}
              {student.phone && <p>Tel: {student.phone}</p>}
            </div>
          </div>
          <button
            onClick={openEdit}
            className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
          >
            <Pencil size={16} /> Editar
          </button>
        </div>
      </div>

      {/* Enrollments */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="font-semibold text-gray-800">Cursos y diplomas</h2>
        </div>
        {enrollments.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">Sin inscripciones</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Curso</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Inicio</th>
                  <th className="text-left px-4 py-3">Estado</th>
                  <th className="text-left px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {enrollments.map((enr) => {
                  const course = enr.Course || enr.CourseEdition?.Course;
                  const courseName = course?.name || enr.CourseEdition?.year || '—';
                  return (
                    <tr key={enr.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{courseName}</td>
                      <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                        {enr.startDate ? new Date(enr.startDate).toLocaleDateString('es-ES') : '—'}
                      </td>
                      <td className="px-4 py-3"><StatusBadge status={enr.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          {enr.status === 'enrolled' && (
                            <button
                              onClick={() => {
                                if (confirm('¿Marcar este curso como terminado?')) {
                                  finishMutation.mutate(enr.id);
                                }
                              }}
                              disabled={finishMutation.isPending}
                              className="text-xs border border-blue-300 text-blue-600 rounded px-2 py-1 hover:bg-blue-50 disabled:opacity-50"
                            >
                              🎓 Terminar
                            </button>
                          )}
                          {enr.status === 'finished' && (
                            <button
                              onClick={() => setDiplomaEnrollment(enr)}
                              className="text-xs border border-green-300 text-green-600 rounded px-2 py-1 hover:bg-green-50"
                            >
                              📄 Diploma
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {showEdit && (
        <Modal title="Editar alumno" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre *</label>
                <input {...register('firstName', { required: 'Requerido' })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apellidos *</label>
                <input {...register('lastName', { required: 'Requerido' })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input {...register('email', { required: 'Requerido' })} type="email" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">DNI/NIE</label>
              <input {...register('dni')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Teléfono</label>
              <input {...register('phone')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEdit(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60">
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Diploma modal */}
      {diplomaEnrollment && (
        <DiplomaModal enrollment={diplomaEnrollment} onClose={() => setDiplomaEnrollment(null)} />
      )}
    </div>
  );
}
