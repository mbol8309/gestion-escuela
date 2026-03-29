import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { useState } from 'react';
import api from '../../services/api';
import ResponsiveTable from '../../components/ResponsiveTable';
import { Plus, Search, ChevronLeft, ChevronRight, X, Pencil, Trash2 } from 'lucide-react';

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

const LIMIT = 20;

export default function Students() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const courseId = searchParams.get('courseId') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [showModal, setShowModal] = useState(false);
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    reset,
    control,
    getValues,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { enrollments: [] } });

  const { fields: enrollmentFields, append, remove } = useFieldArray({ control, name: 'enrollments' });

  const setFilter = (key, value) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value); else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  };

  const setPage = (p) => {
    setSearchParams((prev) => { prev.set('page', String(p)); return prev; });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['students', search, courseId, page],
    queryFn: () =>
      api.get('/students', { params: { search, courseId, page, limit: LIMIT } }).then((r) => r.data),
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then((r) => r.data),
    enabled: showModal,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  const goToStep2 = async () => {
    const valid = await trigger(['firstName', 'lastName', 'email']);
    if (valid) setStep(2);
  };

  const onSubmit = async (formData) => {
    const payload = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      dni: formData.dni,
      phone: formData.phone,
      enrollments: formData.enrollments.filter((e) => e.courseId),
    };
    await api.post('/students', payload);
    setShowModal(false);
    setStep(1);
    reset({ enrollments: [] });
    queryClient.invalidateQueries({ queryKey: ['students'] });
  };

  const openModal = () => {
    reset({ enrollments: [] });
    setStep(1);
    setShowModal(true);
  };

  const columns = [
    {
      key: 'firstName',
      label: 'Nombre',
      subtitle: 'email',
      render: (s) => `${s.firstName} ${s.lastName}`,
    },
    { key: 'email', label: 'Email', hideOnMobile: true, render: (s) => <span className="text-gray-500">{s.email}</span> },
    { key: 'dni', label: 'DNI', hideOnMobile: true, render: (s) => <span className="text-gray-500">{s.dni || '—'}</span> },
    {
      key: 'actions',
      label: '',
      isAction: true,
      render: (s) => (
        <button
          onClick={(e) => { e.stopPropagation(); navigate(`/admin/alumnos/${s.id}`, { state: { searchParams: searchParams.toString() } }); }}
          className="p-1.5 hover:bg-gray-100 rounded"
        >
          <Pencil size={16} />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Alumnos</h1>
        <button
          onClick={openModal}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
        >
          <Plus size={18} /> Nuevo alumno
        </button>
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setFilter('search', e.target.value)}
              placeholder="Buscar por nombre, email, DNI..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>
          <span className="self-center text-sm text-gray-500">{data?.total ?? 0} alumnos</span>
        </div>

        <ResponsiveTable
          columns={columns}
          data={data?.data}
          loading={isLoading}
          onRowClick={(s) => navigate(`/admin/alumnos/${s.id}`, { state: { searchParams: searchParams.toString() } })}
        />

        {totalPages > 1 && (
          <div className="p-4 border-t flex justify-between items-center">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-sm disabled:opacity-40"
            >
              <ChevronLeft size={16} /> Anterior
            </button>
            <span className="text-sm text-gray-500">Página {page} de {totalPages}</span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 text-sm disabled:opacity-40"
            >
              Siguiente <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <Modal title={`Nuevo alumno — Paso ${step} de 2`} onClose={() => setShowModal(false)}>
          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Step indicator */}
            <div className="flex gap-2 mb-5">
              {[1, 2].map((s) => (
                <div key={s} className={`flex-1 h-1.5 rounded-full ${s <= step ? 'bg-indigo-600' : 'bg-gray-200'}`} />
              ))}
            </div>

            {step === 1 && (
              <div className="space-y-4">
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
                  <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
                  <button type="button" onClick={goToStep2} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700">
                    Siguiente →
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium text-gray-700">Asignar cursos</h3>
                  <button
                    type="button"
                    onClick={() => append({ courseId: '', startDate: '', endDate: '' })}
                    className="flex items-center gap-1 text-sm text-indigo-600 hover:underline"
                  >
                    <Plus size={14} /> Añadir curso
                  </button>
                </div>

                {enrollmentFields.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4 border border-dashed rounded-lg">
                    Sin cursos asignados (opcional)
                  </p>
                )}

                {enrollmentFields.map((ef, idx) => (
                  <div key={ef.id} className="border rounded-lg p-3 space-y-2 bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-medium text-gray-500">Curso {idx + 1}</span>
                      <button type="button" onClick={() => remove(idx)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div>
                      <label className="block text-xs mb-1 text-gray-600">Curso *</label>
                      <select
                        {...register(`enrollments.${idx}.courseId`, { required: 'Selecciona un curso' })}
                        className="w-full border rounded px-2 py-1.5 text-sm"
                      >
                        <option value="">— Selecciona —</option>
                        {courses.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs mb-1 text-gray-600">Fecha inicio *</label>
                        <input
                          {...register(`enrollments.${idx}.startDate`, { required: 'Requerido' })}
                          type="date"
                          className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs mb-1 text-gray-600">Fecha fin (opcional)</label>
                        <input
                          {...register(`enrollments.${idx}.endDate`)}
                          type="date"
                          className="w-full border rounded px-2 py-1.5 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">
                    ← Atrás
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {isSubmitting ? 'Creando...' : 'Crear alumno'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </Modal>
      )}
    </div>
  );
}
