import { useRef, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Designer } from '@pdfme/ui';
import { ArrowLeft, Save, Globe, BookOpen, Download } from 'lucide-react';
import api from '../../services/api';

export default function TemplateEditorV2() {
  const { id: templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const designerRef = useRef(null);
  const designer = useRef(null);

  const [savedMsg, setSavedMsg] = useState('');
  const [selectedCourseIds, setSelectedCourseIds] = useState([]);
  const [previewCourseId, setPreviewCourseId] = useState('');
  const [previewEnrollmentId, setPreviewEnrollmentId] = useState('');

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => api.get(`/templates/${templateId}`).then(r => r.data),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses-all'],
    queryFn: () => api.get('/courses?limit=100').then(r => r.data.data || r.data),
  });

  // Enrollments for preview course
  const { data: courseDetail } = useQuery({
    queryKey: ['course', previewCourseId],
    queryFn: () => api.get(`/courses/${previewCourseId}?limit=100`).then(r => r.data),
    enabled: !!previewCourseId,
  });

  useEffect(() => {
    if (template?.Courses) {
      setSelectedCourseIds(template.Courses.map(c => c.id));
      if (template.Courses.length > 0) setPreviewCourseId(template.Courses[0].id);
    }
  }, [template]);

  useEffect(() => {
    if (!designerRef.current || !template || designer.current) return;

    const schemas = (template.fields && Array.isArray(template.fields) && template.fields.length > 0)
      ? template.fields
      : [[]];

    try {
      designer.current = new Designer({
        domContainer: designerRef.current,
        template: {
          basePdf: `${window.location.origin}/api/templates/${templateId}/pdf`,
          schemas,
        },
      });
    } catch (err) {
      console.error('Designer init error:', err);
    }

    return () => {
      if (designer.current) {
        try { designer.current.destroy(); } catch (_) {}
        designer.current = null;
      }
    };
  }, [template, templateId]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const schemas = designer.current ? designer.current.getTemplate().schemas : template.fields;
      return api.put(`/templates/${templateId}`, { fields: schemas });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      setSavedMsg('¡Guardado!');
      setTimeout(() => setSavedMsg(''), 3000);
    },
  });

  const assignMutation = useMutation({
    mutationFn: () => api.post(`/templates/${templateId}/courses`, { courseIds: selectedCourseIds }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
      setSavedMsg('Cursos asignados');
      setTimeout(() => setSavedMsg(''), 3000);
    },
  });

  const handlePreview = async () => {
    if (!previewEnrollmentId) return;
    try {
      const response = await api.post('/templates/generate', {
        templateId,
        enrollmentId: previewEnrollmentId,
      }, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      window.open(url, '_blank');
    } catch (err) {
      alert('Error generando preview: ' + (err.response?.data?.error || err.message));
    }
  };

  const toggleCourse = (courseId) => {
    setSelectedCourseIds(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-64" />
        <div className="h-[600px] bg-gray-200 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!template) {
    return <div className="p-8 text-center text-red-600">Plantilla no encontrada</div>;
  }

  const enrollments = courseDetail?.Enrollments || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/plantillas')} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-gray-900">{template.name}</h1>
              {template.scope === 'global' ? (
                <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full text-xs font-medium">
                  <Globe size={11} /> Global
                </span>
              ) : (
                <span className="flex items-center gap-1 text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full text-xs font-medium">
                  <BookOpen size={11} /> Curso
                </span>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-0.5">Editor de campos de plantilla</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {savedMsg && <span className="text-emerald-600 text-sm font-medium">{savedMsg}</span>}
          <button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
          >
            <Save size={15} />
            {saveMutation.isPending ? 'Guardando...' : 'Guardar campos'}
          </button>
        </div>
      </div>

      {/* Designer */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div ref={designerRef} style={{ height: '600px', width: '100%' }} />
      </div>

      {/* Cursos asignados (solo scope=course) */}
      {template.scope === 'course' && (
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">Cursos asignados</h2>
          <p className="text-sm text-gray-500 mb-4">Selecciona los cursos que usarán esta plantilla</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-4">
            {courses.map(c => (
              <label key={c.id} className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={selectedCourseIds.includes(c.id)}
                  onChange={() => toggleCourse(c.id)}
                  className="rounded text-indigo-600"
                />
                <span className="text-sm text-gray-700 truncate">{c.name}</span>
              </label>
            ))}
          </div>
          <button
            onClick={() => assignMutation.mutate()}
            disabled={assignMutation.isPending}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50"
          >
            {assignMutation.isPending ? 'Guardando...' : 'Guardar asignación'}
          </button>
        </div>
      )}

      {/* Vista previa */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">Vista previa</h2>
        <p className="text-sm text-gray-500 mb-4">Genera un PDF de prueba con datos reales de un alumno</p>
        <div className="flex flex-wrap gap-3 items-end">
          {template.scope === 'course' && (
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Curso</label>
              <select
                value={previewCourseId}
                onChange={e => { setPreviewCourseId(e.target.value); setPreviewEnrollmentId(''); }}
                className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Selecciona curso...</option>
                {template.Courses?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alumno</label>
            <select
              value={previewEnrollmentId}
              onChange={e => setPreviewEnrollmentId(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              disabled={!previewCourseId}
            >
              <option value="">Selecciona alumno...</option>
              {enrollments.map(e => (
                <option key={e.id} value={e.id}>
                  {e.Student?.firstName} {e.Student?.lastName}
                </option>
              ))}
            </select>
          </div>
          <button
            onClick={handlePreview}
            disabled={!previewEnrollmentId}
            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            <Download size={15} />
            Generar preview
          </button>
        </div>
      </div>
    </div>
  );
}
