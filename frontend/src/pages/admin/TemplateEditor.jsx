import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';

const FIELD_OPTIONS = [
  { value: 'firstName', label: 'Nombre' },
  { value: 'lastName', label: 'Apellidos' },
  { value: 'fullName', label: 'Nombre completo' },
  { value: 'dni', label: 'DNI/NIE' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Teléfono' },
  { value: 'address', label: 'Dirección' },
  { value: 'birthDate', label: 'Fecha de nacimiento' },
  { value: 'courseName', label: 'Nombre del curso' },
  { value: 'startDate', label: 'Fecha de inicio' },
  { value: 'endDate', label: 'Fecha de fin' },
  { value: 'finishedAt', label: 'Fecha de finalización' },
  { value: 'academyName', label: 'Nombre academia' },
];

export default function TemplateEditor() {
  const { id: courseId, templateId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [fields, setFields] = useState([]);
  const [pendingField, setPendingField] = useState(null); // { x, y } captured from click
  const [saved, setSaved] = useState(false);

  const { data: template, isLoading } = useQuery({
    queryKey: ['template', templateId],
    queryFn: () => api.get(`/courses/${courseId}/templates`).then((r) => {
      const t = r.data.find((t) => t.id === templateId);
      return t;
    }),
  });

  useEffect(() => {
    if (template?.fields) setFields(template.fields);
  }, [template]);

  const saveMutation = useMutation({
    mutationFn: () => api.put(`/templates/${templateId}/fields`, fields),
    onSuccess: () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      queryClient.invalidateQueries({ queryKey: ['template', templateId] });
    },
  });

  const handlePdfClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const pdfWidth = 595;
    const pdfHeight = 842;
    const scaleX = pdfWidth / rect.width;
    const scaleY = pdfHeight / rect.height;
    setPendingField({
      x: Math.round(x * scaleX),
      y: Math.round(y * scaleY),
      field: 'fullName',
      fontSize: 14,
      color: '#000000',
    });
  };

  const confirmPendingField = () => {
    if (!pendingField) return;
    setFields((prev) => [...prev, pendingField]);
    setPendingField(null);
  };

  const updateField = (idx, key, value) => {
    setFields((prev) => prev.map((f, i) => i === idx ? { ...f, [key]: value } : f));
  };

  const removeField = (idx) => {
    setFields((prev) => prev.filter((_, i) => i !== idx));
  };

  if (isLoading) return <div className="p-8 text-center text-gray-400">Cargando plantilla...</div>;
  if (!template) return <div className="p-8 text-center text-red-500">Plantilla no encontrada</div>;

  const pdfUrl = `${import.meta.env.VITE_API_URL || ''}/api/templates/${templateId}/pdf`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(`/admin/cursos/${courseId}`)}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft size={16} /> Volver al curso
        </button>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Editor de plantilla: {template.name}</h1>
        <button
          onClick={() => saveMutation.mutate()}
          disabled={saveMutation.isPending}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm disabled:opacity-60"
        >
          <Save size={16} /> {saveMutation.isPending ? 'Guardando...' : 'Guardar configuración'}
        </button>
      </div>
      {saved && <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">✅ Campos guardados</p>}

      <div className="flex gap-6 items-start">
        {/* PDF Preview */}
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-500 mb-2">
            Haz click en el PDF para añadir un campo en esa posición
          </p>
          <div
            className="relative border rounded-lg overflow-hidden cursor-crosshair shadow"
            style={{ paddingTop: '141.4%' }} // A4 ratio
            onClick={handlePdfClick}
          >
            <iframe
              src={pdfUrl}
              className="absolute inset-0 w-full h-full pointer-events-none"
              title="Plantilla PDF"
            />
            {/* Field overlay circles */}
            {fields.map((f, i) => {
              const left = (f.x / 595) * 100;
              const top = (f.y / 842) * 100;
              return (
                <div
                  key={i}
                  className="absolute w-4 h-4 rounded-full border-2 border-white shadow -translate-x-2 -translate-y-2 flex items-center justify-center text-white text-xs font-bold"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    backgroundColor: f.color || '#6366f1',
                    pointerEvents: 'none',
                  }}
                  title={f.field}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>

        {/* Fields panel */}
        <div className="w-80 flex-shrink-0 space-y-3">
          <h2 className="font-semibold text-gray-700">Campos ({fields.length})</h2>

          {/* Pending field confirmation */}
          {pendingField && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-indigo-700">
                Nuevo campo en ({pendingField.x}, {pendingField.y})
              </p>
              <select
                value={pendingField.field}
                onChange={(e) => setPendingField({ ...pendingField, field: e.target.value })}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                {FIELD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={pendingField.fontSize}
                  onChange={(e) => setPendingField({ ...pendingField, fontSize: parseInt(e.target.value) || 12 })}
                  className="w-20 border rounded px-2 py-1 text-sm"
                  placeholder="Tamaño"
                  min="8"
                  max="72"
                />
                <input
                  type="color"
                  value={pendingField.color}
                  onChange={(e) => setPendingField({ ...pendingField, color: e.target.value })}
                  className="w-10 h-8 border rounded cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={confirmPendingField}
                  className="flex-1 bg-indigo-600 text-white rounded py-1.5 text-sm hover:bg-indigo-700"
                >
                  <Plus size={14} className="inline" /> Añadir
                </button>
                <button
                  onClick={() => setPendingField(null)}
                  className="flex-1 border rounded py-1.5 text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {fields.length === 0 && !pendingField && (
            <p className="text-sm text-gray-400 text-center py-4">
              Haz click en el PDF para añadir campos
            </p>
          )}

          {fields.map((f, idx) => (
            <div key={idx} className="border rounded-lg p-3 space-y-2 bg-white">
              <div className="flex justify-between items-center">
                <span className="text-xs font-mono text-gray-400">#{idx + 1} ({f.x}, {f.y})</span>
                <button onClick={() => removeField(idx)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
              <select
                value={f.field}
                onChange={(e) => updateField(idx, 'field', e.target.value)}
                className="w-full border rounded px-2 py-1.5 text-sm"
              >
                {FIELD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <div className="flex gap-2 items-center">
                <input
                  type="number"
                  value={f.fontSize || 12}
                  onChange={(e) => updateField(idx, 'fontSize', parseInt(e.target.value) || 12)}
                  className="w-20 border rounded px-2 py-1 text-sm"
                  min="8"
                  max="72"
                  placeholder="px"
                />
                <input
                  type="color"
                  value={f.color || '#000000'}
                  onChange={(e) => updateField(idx, 'color', e.target.value)}
                  className="w-10 h-8 border rounded cursor-pointer"
                />
                <span className="text-xs text-gray-400 flex-1">{f.fontSize || 12}px</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
