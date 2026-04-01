import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState, useRef } from 'react';
import api from '../../services/api';
import { ArrowLeft, Pencil, X, Users, Calendar, Plus, FileText, Globe, BookOpen, CheckSquare, Square, Download, Check } from 'lucide-react';

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
  const [showAssignTemplate, setShowAssignTemplate] = useState(false);
  const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState([]);
  const [showBatchDiplomaModal, setShowBatchDiplomaModal] = useState(false);
  const [batchTemplateId, setBatchTemplateId] = useState('');
  const [batchLoading, setBatchLoading] = useState(false);
  const fileRef = useRef(null);

  const { data: course, isLoading, error } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}?limit=200`).then((r) => r.data),
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['course-templates', id],
    queryFn: () => api.get(`/courses/${id}/templates`).then((r) => r.data),
  });

  const { data: allTemplates = [] } = useQuery({
    queryKey: ['templates'],
    queryFn: () => api.get('/templates').then(r => r.data),
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
    form.append('scope', 'course');
    form.append('pdf', file);
    await api.post(`/courses/${id}/templates`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    setShowTemplateModal(false);
    resetT();
    queryClient.invalidateQueries({ queryKey: ['course-templates', id] });
    queryClient.invalidateQueries({ queryKey: ['templates'] });
  };

  // Assign existing template to course
  const [assignTemplateId, setAssignTemplateId] = useState('');
  const assignMutation = useMutation({
    mutationFn: async (templateId) => {
      const t = allTemplates.find(t => t.id === templateId);
      if (!t) return;
      const currentCourseIds = (t.Courses || []).map(c => c.id);
      if (!currentCourseIds.includes(id)) {
        await api.post(`/templates/${templateId}/courses`, { courseIds: [...currentCourseIds, id] });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-templates', id] });
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      setShowAssignTemplate(false);
      setAssignTemplateId('');
    },
  });

  const toggleEnrollment = (eid) => {
    setSelectedEnrollmentIds(prev =>
      prev.includes(eid) ? prev.filter(x => x !== eid) : [...prev, eid]
    );
  };

  const toggleAll = () => {
    const enrollments = course?.Enrollments || [];
    if (selectedEnrollmentIds.length === enrollments.length) {
      setSelectedEnrollmentIds([]);
    } else {
      setSelectedEnrollmentIds(enrollments.map(e => e.id));
    }
  };

  const batchFinish = async () => {
    if (!confirm(`¿Terminar el curso para ${selectedEnrollmentIds.length} alumnos?`)) return;
    await api.post('/enrollments/batch', { enrollmentIds: selectedEnrollmentIds, action: 'finish' });
    queryClient.invalidateQueries({ queryKey: ['course', id] });
    setSelectedEnrollmentIds([]);
  };

  const batchGenerate = async () => {
    if (!batchTemplateId) return alert('Selecciona una plantilla');
    setBatchLoading(true);
    try {
      const response = await api.post('/enrollments/batch', {
        enrollmentIds: selectedEnrollmentIds,
        action: 'generate-diplomas',
        templateId: batchTemplateId,
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/zip' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = 'diplomas.zip';
      a.click();
      setShowBatchDiplomaModal(false);
      setSelectedEnrollmentIds([]);
    } catch (err) {
      alert('Error: ' + (err.message || 'Error desconocido'));
    } finally {
      setBatchLoading(false);
    }
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

  const enrollments = course.Enrollments || [];
  const allSelected = selectedEnrollmentIds.length === enrollments.length && enrollments.length > 0;
  const courseTemplates = templates.filter(t => t.scope === 'course');
  const globalTemplates = templates.filter(t => t.scope === 'global');

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/admin/cursos')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft size={16} /> Volver a cursos
      </button>

      {/* Header */}
      <div className="bg-white rounded-xl shadow p-6">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{course.name}</h1>
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
        <div className="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-2">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <FileText size={18} /> Plantillas PDF
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAssignTemplate(true)}
              className="flex items-center gap-1 text-sm text-indigo-600 border border-indigo-200 rounded-lg px-3 py-1.5 hover:bg-indigo-50"
            >
              <Plus size={14} /> Asignar plantilla
            </button>
            <button
              onClick={() => navigate('/admin/plantillas')}
              className="flex items-center gap-1 text-sm text-gray-600 border rounded-lg px-3 py-1.5 hover:bg-gray-50"
            >
              <FileText size={14} /> Gestionar plantillas
            </button>
          </div>
        </div>

        {/* Global templates */}
        {globalTemplates.length > 0 && (
          <div className="px-6 py-3">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Globales</p>
            <div className="space-y-1">
              {globalTemplates.map(t => (
                <div key={t.id}
                  className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/admin/plantillas/${t.id}/editor`)}
                >
                  <div className="flex items-center gap-2">
                    <Globe size={14} className="text-emerald-500" />
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                  <span className="text-xs text-indigo-600 border border-indigo-200 rounded px-2 py-0.5 hover:bg-indigo-50">Editar →</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course-specific templates */}
        <div className="px-6 py-3">
          {courseTemplates.length > 0 && (
            <>
              <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">De este curso</p>
              <div className="space-y-1">
                {courseTemplates.map(t => (
                  <div key={t.id}
                    className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/admin/plantillas/${t.id}/editor`)}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen size={14} className="text-indigo-500" />
                      <span className="text-sm font-medium">{t.name}</span>
                    </div>
                    <span className="text-xs text-indigo-600 border border-indigo-200 rounded px-2 py-0.5 hover:bg-indigo-50">Editar →</span>
                  </div>
                ))}
              </div>
            </>
          )}
          {templates.length === 0 && (
            <p className="text-center py-6 text-gray-400 text-sm">Sin plantillas. Asigna o crea una.</p>
          )}
        </div>
      </div>

      {/* Enrollments with batch actions */}
      <div className="bg-white rounded-xl shadow">
        <div className="px-6 py-4 border-b flex justify-between items-center flex-wrap gap-2">
          <h2 className="font-semibold text-gray-800 flex items-center gap-2">
            <Users size={18} /> Alumnos inscritos ({course.enrollmentTotal ?? enrollments.length})
          </h2>
        </div>

        {/* Batch action bar */}
        {selectedEnrollmentIds.length > 0 && (
          <div className="px-6 py-3 bg-indigo-50 border-b flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-indigo-700">{selectedEnrollmentIds.length} seleccionados</span>
            <button
              onClick={batchFinish}
              className="flex items-center gap-1.5 bg-emerald-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-emerald-700"
            >
              <Check size={14} /> Terminar curso
            </button>
            <button
              onClick={() => setShowBatchDiplomaModal(true)}
              className="flex items-center gap-1.5 bg-indigo-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-indigo-700"
            >
              <Download size={14} /> Generar diplomas (ZIP)
            </button>
            <button
              onClick={() => setSelectedEnrollmentIds([])}
              className="text-sm text-gray-500 hover:text-gray-700 ml-auto"
            >
              Cancelar
            </button>
          </div>
        )}

        {enrollments.length === 0 ? (
          <p className="text-center py-8 text-gray-400 text-sm">Sin alumnos inscritos</p>
        ) : (
          <div>
            {/* Select all row */}
            <div className="px-6 py-2 border-b bg-gray-50 flex items-center gap-3">
              <button onClick={toggleAll} className="flex items-center gap-2 text-sm text-gray-600 hover:text-indigo-600">
                {allSelected ? <CheckSquare size={16} className="text-indigo-600" /> : <Square size={16} />}
                <span>{allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}</span>
              </button>
            </div>
            <div className="divide-y">
              {enrollments.map((enr) => (
                <div key={enr.id} className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50">
                  <button onClick={() => toggleEnrollment(enr.id)} className="flex-shrink-0">
                    {selectedEnrollmentIds.includes(enr.id)
                      ? <CheckSquare size={16} className="text-indigo-600" />
                      : <Square size={16} className="text-gray-400" />}
                  </button>
                  <div
                    className="flex-1 flex items-center justify-between cursor-pointer"
                    onClick={() => navigate(`/admin/alumnos/${enr.Student?.id}`)}
                  >
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Edit course modal */}
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

      {/* Upload template modal */}
      {showTemplateModal && (
        <Modal title="Subir plantilla PDF" onClose={() => setShowTemplateModal(false)}>
          <form onSubmit={handleSubmitT(onSubmitTemplate)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input {...regT('name', { required: 'Requerido' })} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" placeholder="Diploma de asistencia" />
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

      {/* Assign existing template modal */}
      {showAssignTemplate && (
        <Modal title="Asignar plantilla existente" onClose={() => setShowAssignTemplate(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Selecciona una plantilla con scope "curso" para asignarla a este curso.</p>
            <select
              value={assignTemplateId}
              onChange={e => setAssignTemplateId(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="">Selecciona plantilla...</option>
              {allTemplates.filter(t => t.scope === 'course').map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAssignTemplate(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button
                onClick={() => assignTemplateId && assignMutation.mutate(assignTemplateId)}
                disabled={!assignTemplateId || assignMutation.isPending}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {assignMutation.isPending ? 'Asignando...' : 'Asignar'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Batch diploma modal */}
      {showBatchDiplomaModal && (
        <Modal title="Generar diplomas en lote" onClose={() => setShowBatchDiplomaModal(false)}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Se generará un ZIP con diplomas para los {selectedEnrollmentIds.length} alumnos seleccionados.
            </p>
            <div>
              <label className="block text-sm font-medium mb-1">Plantilla</label>
              <select
                value={batchTemplateId}
                onChange={e => setBatchTemplateId(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                <option value="">Selecciona plantilla...</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name} {t.scope === 'global' ? '(global)' : ''}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowBatchDiplomaModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button
                onClick={batchGenerate}
                disabled={!batchTemplateId || batchLoading}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {batchLoading ? 'Generando...' : <><Download size={14} /> Descargar ZIP</>}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
