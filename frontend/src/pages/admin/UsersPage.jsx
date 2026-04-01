import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import { useAuthStore } from '../../store/authStore';
import Pagination from '../../components/Pagination';
import PageSizeSelector from '../../components/PageSizeSelector';
import { Plus, Trash2, X, Shield } from 'lucide-react';

const ROLE_LABELS = { admin: 'Administrador', gestor: 'Gestor' };
const ROLE_COLORS = { admin: 'bg-purple-100 text-purple-700', gestor: 'bg-blue-100 text-blue-700' };

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', password: '', role: 'gestor' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const roleFilter = searchParams.get('role') || '';

  const setFilter = (key, value) => {
    setSearchParams(prev => {
      if (value) prev.set(key, value); else prev.delete(key);
      prev.set('page', '1');
      return prev;
    });
  };

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['admin-users', page, limit, roleFilter],
    queryFn: () => api.get('/users', { params: { page, limit, ...(roleFilter ? { role: roleFilter } : {}) } }).then(r => r.data),
    keepPreviousData: true,
  });

  const users = usersData?.data || [];
  const total = usersData?.total || 0;

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setFormError('Email y contraseña son requeridos'); return; }
    setSaving(true); setFormError('');
    try {
      await api.post('/users', form);
      toast('Usuario creado correctamente');
      setShowModal(false);
      setForm({ email: '', firstName: '', lastName: '', password: '', role: 'gestor' });
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear usuario');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id, email) => {
    if (!confirm(`¿Eliminar usuario ${email}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      toast('Usuario eliminado');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    } catch (err) {
      toast(err.response?.data?.error || 'Error al eliminar', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Shield size={22} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-800">Usuarios Administración</h1>
        </div>
        <button
          onClick={() => { setForm({ email: '', firstName: '', lastName: '', password: '', role: 'gestor' }); setShowModal(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
        >
          <Plus size={16} /> Nuevo usuario
        </button>
      </div>

      {/* Filtros por rol */}
      <div className="flex gap-2 mb-4">
        {[{ value: '', label: 'Todos' }, { value: 'admin', label: 'Administradores' }, { value: 'gestor', label: 'Gestores' }].map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilter('role', opt.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${roleFilter === opt.value ? 'bg-indigo-600 text-white' : 'bg-white border hover:bg-gray-50 text-gray-600'}`}
          >
            {opt.label}
          </button>
        ))}
        <span className="ml-auto self-center text-sm text-gray-400">{total} usuarios</span>
      </div>

      <div className="bg-white rounded-xl shadow">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-pulse space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-12 bg-gray-200 rounded" />)}
            </div>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-10 text-gray-400">No hay usuarios</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">
                      {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {u.role !== 'admin' && u.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDelete(u.id, u.email)}
                          className="text-red-400 hover:text-red-600 p-1"
                          title="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-3 border-t flex items-center justify-between flex-wrap gap-3">
              <PageSizeSelector value={limit} onChange={v => setFilter('limit', v)} />
              <Pagination
                page={page}
                total={total}
                limit={limit}
                onPage={p => setFilter('page', p)}
              />
            </div>
          </>
        )}
      </div>

      {showModal && (
        <Modal title="Nuevo usuario administración" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apellidos</label>
                <input value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña *</label>
              <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Rol</label>
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})}
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm">
                <option value="gestor">Gestor</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            {formError && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{formError}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button type="submit" disabled={saving} className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60">
                {saving ? 'Creando...' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
