import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState, useRef } from 'react';
import api from '../../services/api';
import { ArrowLeft, Pencil, X, Users, Calendar, Plus, FileText } from 'lucide-react';

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

export default function CourseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showEdit, setShowEdit] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const fileRef = useRef(null);

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`).then((r) => r.data),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates', id],
    queryFn: () => api.get(`/courses/${id}/templates`).then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();
  const {
    register: regT,
    handleSubmit: handleSubmitT,
    reset: resetT,
    formState: { isSubmitting: isSubmittingT },
  } = useForm();

  const openEdit = () => {
    reset({ name: course.name, description: course.description || '' });
    setShowEdit(true);
  };

  const onSubmit = async (data) => {
    await api.put(`/courses/${id}`, data);
    setShowEdit(false);
    queryClient.invalidateQueries({ queryKey: ['course', id] });
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  const onSubmitTemplate = async (data) => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    const form = new FormData();
    form.append('name', data.name);
    form.append('type', data.type || 'diploma');
    form.append('pdf', file);
    await api.post(`/courses/${id}/templates`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setShowTemplateModal(false);
    resetT();
    queryClient.invalidateQueries({ queryKey: ['templates', id] });
  };

  if (isLoading) {    return (
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

  const enrollments = course.Enrollments || [];

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
            </div>
            {course.description && (
              <p className="mt-2 text-sm text-gray-600">{course.description}</p>
            )}
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

      {/* Templates */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={18} /> Plantillas PDF
          </h2>
          <button
            onClick={() => { resetT(); setShowTemplateModal(true); }}
            className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
          >
            <Plus size={14} /> Subir plantilla
          </button>
        </div>
        {templates.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Sin plantillas. Sube un PDF para crear diplomas.</p>
        ) : (
          <div className="divide-y">
            {templates.map((t) => (
              <div
                key={t.id}
                className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate(`/admin/cursos/${id}/plantillas/${t.id}`)}
              >
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.type === 'diploma' ? '🎓 Diploma' : '📋 Ficha de inscripción'} · {t.fields?.length || 0} campos
                  </p>
                </div>
                <span className="text-xs text-indigo-600 border border-indigo-200 rounded px-2 py-1 hover:bg-indigo-50">
                  Editar campos →
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enrollments */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users size={18} /> Alumnos inscritos ({enrollments.length})
          </h2>
        </div>
        {enrollments.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Sin alumnos inscritos</p>
        ) : (
          <div className="divide-y">
            {enrollments.map((enr) => (
              <div key={enr.id} className="px-6 py-3 flex items-center justify-between hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/admin/alumnos/${enr.Student?.id}`)}>
                <div>
                  <p className="font-medium text-sm">{enr.Student?.firstName} {enr.Student?.lastName}</p>
                  <p className="text-xs text-gray-400">{enr.Student?.email}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  enr.status === 'enrolled' ? 'bg-green-100 text-green-700' :
                  enr.status === 'finished' ? 'bg-blue-100 text-blue-700' :
                  enr.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-gray-100 text-gray-500'
                }`}>{enr.status}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit modal */}
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
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowEdit(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60">
                {isSubmitting ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Template upload modal */}
      {showTemplateModal && (
        <Modal title="Subir plantilla PDF" onClose={() => setShowTemplateModal(false)}>
          <form onSubmit={handleSubmitT(onSubmitTemplate)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input {...regT('name', { required: 'Requerido' })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Diploma de asistencia" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select {...regT('type')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
                <option value="diploma">🎓 Diploma</option>
                <option value="enrollment_form">📋 Ficha de inscripción</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Archivo PDF *</label>
              <input ref={fileRef} type="file" accept="application/pdf" className="w-full text-sm border rounded-lg px-3 py-2" required />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowTemplateModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={isSubmittingT} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60">
                {isSubmittingT ? 'Subiendo...' : 'Subir plantilla'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
