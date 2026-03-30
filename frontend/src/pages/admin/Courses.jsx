import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import api from '../../services/api';
import ResponsiveTable from '../../components/ResponsiveTable';
import Pagination from '../../components/Pagination';
import PageSizeSelector from '../../components/PageSizeSelector';
import { Plus, Search, Pencil, Trash2, X } from 'lucide-react';

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

export default function Courses() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  const [searchInput, setSearchInput] = useState(search);
  const [debouncedSearch] = useDebounce(searchInput, 400);

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const setFilter = (key, value) => {
    setSearchParams((prev) => {
      if (value) prev.set(key, value); else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  };

  useEffect(() => {
    setFilter('search', debouncedSearch);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const setPage = (p) => setSearchParams((prev) => { prev.set('page', String(p)); return prev; });
  const setLimit = (l) => setSearchParams((prev) => { prev.set('limit', String(l)); prev.set('page', '1'); return prev; });

  const { data, isLoading } = useQuery({
    queryKey: ['courses', search, page, limit],
    queryFn: () => api.get('/courses', { params: { search, page, limit } }).then((r) => r.data),
    keepPreviousData: true,
  });

  const courses = data?.data || [];

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (c) => {
    setEditing(c);
    reset({ name: c.name, description: c.description || '' });
    setShowModal(true);
  };

  const onSubmit = async (data) => {
    if (editing) await api.put(`/courses/${editing.id}`, data);
    else await api.post('/courses', data);
    setShowModal(false);
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Eliminar curso?')) return;
    await api.delete(`/courses/${id}`);
    queryClient.invalidateQueries({ queryKey: ['courses'] });
  };

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      render: (c) => <span className="font-medium">{c.name}</span>,
    },
    {
      key: 'actions',
      label: '',
      isAction: true,
      render: (c) => (
        <div className="flex gap-2 justify-end">
          <button onClick={(e) => { e.stopPropagation(); openEdit(c); }} className="p-1.5 hover:bg-gray-100 rounded"><Pencil size={16} /></button>
          <button onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><Trash2 size={16} /></button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Cursos</h1>
        <button onClick={openCreate} className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm">
          <Plus size={18} /> Nuevo curso
        </button>
      </div>

      <div className="bg-white rounded-xl shadow">
        <div className="p-4 border-b flex gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Buscar cursos..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>
        </div>

        <ResponsiveTable
          columns={columns}
          data={courses}
          loading={isLoading}
          onRowClick={(c) => navigate(`/admin/cursos/${c.id}`)}
        />
        <div className="flex items-center justify-between px-4 pt-3 pb-1 flex-wrap gap-3">
          <PageSizeSelector value={limit} onChange={setLimit} />
          <Pagination page={page} total={data?.total ?? 0} limit={limit} onPage={setPage} />
        </div>
      </div>

      {showModal && (
        <Modal title={editing ? 'Editar curso' : 'Nuevo curso'} onClose={() => setShowModal(false)}>
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
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
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
