import { useParams, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import api from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import { useAuthStore } from '../../store/authStore';
import Pagination from '../../components/Pagination';
import { ArrowLeft, Pencil, X, Download, Mail, CheckCircle, Plus, Trash2 } from 'lucide-react';

function StatusBadge({ status }) {
  const map = {
    draft: { label: 'Borrador', cls: 'bg-gray-100 text-gray-600' },
    pending: { label: 'Pendiente', cls: 'bg-yellow-100 text-yellow-700' },
    enrolled: { label: 'Matriculado', cls: 'bg-green-100 text-green-700' },
    active: { label: 'Activo', cls: 'bg-blue-100 text-blue-700' },
    finished: { label: 'Finalizado', cls: 'bg-blue-100 text-blue-700' },
    rejected: { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
    completed: { label: 'Completado', cls: 'bg-green-100 text-green-700' },
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
  const courseId = enrollment.courseId || enrollment.Course?.id;
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

function AssignCourseModal({ studentId, onClose, onSuccess }) {
  const [courseId, setCourseId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const { data: coursesData, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses', { params: { limit: 100 } }).then((r) => r.data),
  });
  const courses = coursesData?.data || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!courseId || !startDate) { setError('Selecciona curso y fecha de inicio'); return; }
    setSaving(true);
    try {
      await api.post('/enrollments', {
        studentId,
        courseId,
        startDate,
        endDate: endDate || null,
        status: 'pending',
      });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al asignar curso');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="➕ Asignar curso" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-red-500 text-sm bg-red-50 rounded p-2">{error}</p>}
        <div>
          <label className="block text-sm font-medium mb-1">Curso *</label>
          {isLoading ? (
            <p className="text-sm text-gray-400">Cargando...</p>
          ) : (
            <select
              value={courseId}
              onChange={e => setCourseId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              required
            >
              <option value="">— Selecciona un curso —</option>
              {courses.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha inicio *</label>
          <input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Fecha fin (opcional)</label>
          <input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
          />
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Asignando...' : 'Asignar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function StudentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuthStore();
  const [showEdit, setShowEdit] = useState(false);
  const [diplomaEnrollment, setDiplomaEnrollment] = useState(null);
  const [showAssignCourse, setShowAssignCourse] = useState(false);
  const [enrollPage, setEnrollPage] = useState(1);
  const ENROLL_LIMIT = 20;

  const prevSearch = location.state?.searchParams || '';

  const { data: student, isLoading, error } = useQuery({
    queryKey: ['student', id, enrollPage],
    queryFn: () => api.get(`/students/${id}`, { params: { enrollPage, enrollLimit: ENROLL_LIMIT } }).then((r) => r.data),
    keepPreviousData: true,
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const finishMutation = useMutation({
    mutationFn: (enrollmentId) => api.put(`/enrollments/${enrollmentId}/finish`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      setEnrollPage(1);
      toast('Curso marcado como terminado');
    },
    onError: (err) => toast(err.response?.data?.error || 'Error al terminar curso', 'error'),
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId) => api.delete(`/enrollments/${enrollmentId}`),
    onSuccess: () => {
      toast('Inscripción eliminada');
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      setEnrollPage(1);
    },
    onError: (err) => toast(err.response?.data?.error || 'Error al eliminar', 'error'),
  });

  const sendActivationMutation = useMutation({
    mutationFn: () => api.post(`/students/${id}/send-activation`),
    onSuccess: () => {
      toast('Email de activación enviado correctamente');
      queryClient.invalidateQueries({ queryKey: ['student', id] });
    },
    onError: (err) => toast(err.response?.data?.error || 'Error al enviar el email', 'error'),
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/students/${id}`),
    onSuccess: () => {
      toast('Alumno eliminado');
      navigate(`/admin/alumnos${prevSearch ? '?' + prevSearch : ''}`);
    },
    onError: (err) => toast(err.response?.data?.error || 'Error al eliminar alumno', 'error'),
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
    try {
      await api.put(`/students/${id}`, formData);
      setShowEdit(false);
      queryClient.invalidateQueries({ queryKey: ['student', id] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast('Datos actualizados');
    } catch (err) {
      toast(err.response?.data?.error || 'Error al guardar', 'error');
    }
  };

  const goBack = () => {
    navigate(`/admin/alumnos${prevSearch ? '?' + prevSearch : ''}`);
  };

  const handleDelete = () => {
    if (confirm(`¿Eliminar al alumno ${student.firstName} ${student.lastName}? Esta acción no se puede deshacer.`)) {
      deleteMutation.mutate();
    }
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
  const enrollmentTotal = student.enrollmentTotal ?? enrollments.length;

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
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900">{student.firstName} {student.lastName}</h1>
              <StatusBadge status={student.status || 'draft'} />
            </div>
            <div className="mt-2 space-y-1 text-sm text-gray-600">
              <p>{student.email}</p>
              {student.dni && <p>DNI: {student.dni}</p>}
              {student.phone && <p>Tel: {student.phone}</p>}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={openEdit}
              className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50"
            >
              <Pencil size={16} /> Editar
            </button>
            {!student.userId && (
              <button
                onClick={() => sendActivationMutation.mutate()}
                disabled={sendActivationMutation.isPending}
                className="flex items-center gap-2 border border-indigo-300 text-indigo-600 rounded-lg px-4 py-2 text-sm hover:bg-indigo-50 disabled:opacity-50"
              >
                <Mail size={16} /> {sendActivationMutation.isPending ? 'Enviando...' : 'Enviar activación'}
              </button>
            )}
            {student.userId && (
              <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle size={14} /> Cuenta activa
              </span>
            )}
            {user?.role === 'admin' && (
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 border border-red-300 text-red-600 rounded-lg px-4 py-2 text-sm hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={16} /> {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar alumno'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Enrollments */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-800">Cursos y diplomas</h2>
          <button
            onClick={() => setShowAssignCourse(true)}
            className="flex items-center gap-1 text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50"
          >
            <Plus size={14} /> Asignar curso
          </button>
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
                  const courseName = enr.Course?.name || '—';
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
                          {(enr.status === 'pending' || enr.status === 'draft') && (
                            <button
                              onClick={() => {
                                if (confirm('¿Eliminar esta inscripción?')) removeEnrollmentMutation.mutate(enr.id);
                              }}
                              className="text-xs border border-red-200 text-red-500 rounded px-2 py-1 hover:bg-red-50"
                            >
                              🗑️ Quitar
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
        <Pagination page={enrollPage} total={enrollmentTotal} limit={ENROLL_LIMIT} onPage={setEnrollPage} />
      </div>
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

      {/* Assign course modal */}
      {showAssignCourse && (
        <AssignCourseModal
          studentId={id}
          onClose={() => setShowAssignCourse(false)}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['student', id] });
            toast('Curso asignado correctamente');
          }}
        />
      )}

      {/* Diploma modal */}
      {diplomaEnrollment && (
        <DiplomaModal enrollment={diplomaEnrollment} onClose={() => setDiplomaEnrollment(null)} />
      )}
    </div>
  );
}
