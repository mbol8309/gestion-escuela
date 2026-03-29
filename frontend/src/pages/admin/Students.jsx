import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import api from '../../services/api';
import ResponsiveTable from '../../components/ResponsiveTable';
import { Plus, Search, ChevronLeft, ChevronRight, X, Pencil } from 'lucide-react';

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

const LIMIT = 20;

export default function Students() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const courseId = searchParams.get('courseId') || '';
  const page = parseInt(searchParams.get('page') || '1');

  const [showModal, setShowModal] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

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

  const totalPages = Math.ceil((data?.total ?? 0) / LIMIT);

  const onSubmit = async (formData) => {
    await api.post('/students', formData);
    setShowModal(false);
    reset();
    queryClient.invalidateQueries({ queryKey: ['students'] });
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
          onClick={() => { reset(); setShowModal(true); }}
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
        <Modal title="Nuevo alumno" onClose={() => setShowModal(false)}>
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
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60">
                {isSubmitting ? 'Guardando...' : 'Crear alumno'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
