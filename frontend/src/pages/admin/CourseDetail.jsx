import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import api from '../../services/api';
import { ArrowLeft, Pencil, X, Users, Calendar } from 'lucide-react';

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const openEdit = () => {
    reset({ name: course.name, description: course.description || '', active: course.active });
    setShowEdit(true);
  };

  const onSubmit = async (data) => {
    await api.put(`/courses/${id}`, data);
    setShowEdit(false);
    queryClient.invalidateQueries({ queryKey: ['course', id] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        <div className="bg-white rounded-xl shadow p-6 space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg mb-4">Curso no encontrado</p>
        <button onClick={() => navigate('/admin/cursos')} className="text-indigo-600 hover:underline flex items-center gap-1 mx-auto">
          <ArrowLeft size={16} /> Volver a cursos
        </button>
      </div>
    );
  }

  const editions = course.CourseEditions || [];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/cursos')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={16} /> Volver a cursos
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {course.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            {course.description && (
              <p className="mt-2 text-sm text-gray-600">{course.description}</p>
            )}
            <div className="mt-3 flex gap-4 text-sm text-gray-500">
              <span>{editions.length} edicion{editions.length !== 1 ? 'es' : ''}</span>
            </div>
          </div>
          <button onClick={openEdit} className="flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50">
            <Pencil size={16} /> Editar
          </button>
        </div>
        <div className="mt-4">
          <button
            onClick={() => navigate(`/admin/alumnos?courseId=${id}`)}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50"
          >
            <Users size={14} /> Ver todos los alumnos del curso
          </button>
        </div>
      </div>

      {/* Editions */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-800 px-1">Ediciones</h2>
        {editions.length === 0 ? (
          <div className="bg-white rounded-xl shadow p-8 text-center text-gray-400 text-sm">
            Sin ediciones registradas
          </div>
        ) : (
          editions.map((ed) => (
            <div key={ed.id} className="bg-white rounded-xl shadow p-5">
              <div className="flex justify-between items-start flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-900">{ed.year || ed.name || `Edición ${ed.id}`}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      ed.status === 'active' ? 'bg-yellow-100 text-yellow-700' :
                      ed.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {ed.status === 'active' ? 'En curso' : ed.status === 'completed' ? 'Completada' : ed.status || 'Pendiente'}
                    </span>
                  </div>
                  <div className="mt-1 flex gap-4 text-xs text-gray-500 flex-wrap">
                    {ed.startDate && (
                      <span className="flex items-center gap-1">
                        <Calendar size={12} />
                        {new Date(ed.startDate).toLocaleDateString('es-ES')}
                        {ed.endDate && ` — ${new Date(ed.endDate).toLocaleDateString('es-ES')}`}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users size={12} />
                      {ed.Enrollments?.length ?? ed._enrollmentCount ?? 0} inscritos
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/admin/alumnos?courseId=${ed.id}`)}
                  className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50"
                >
                  <Users size={13} /> Ver alumnos
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {showEdit && (
        <Modal title="Editar curso" onClose={() => setShowEdit(false)}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input {...register('name', { required: 'Requerido' })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <textarea {...register('description')} rows={3} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-none" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" {...register('active')} id="active-edit" className="rounded" />
              <label htmlFor="active-edit" className="text-sm">Activo</label>
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
    </div>
  );
}
