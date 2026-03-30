import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { useToast } from '../../components/ToastProvider';
import { useAuthStore } from '../../store/authStore';
import Pagination from '../../components/Pagination';
import { Plus, Trash2, X, UserCog } from 'lucide-react';

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
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', firstName: '', lastName: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const { data: usersData, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => api.get('/users', { params: { page, limit: LIMIT } }).then(r => r.data),
    keepPreviousData: true,
  });

  const users = usersData?.data || [];
  const gestores = users.filter(u => u.role === 'gestor');

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) { setFormError('Email y contraseña son requeridos'); return; }
    setSaving(true);
    setFormError('');
    try {
      await api.post('/users', { ...form, role: 'gestor' });
      toast('Gestor creado correctamente');
      setShowModal(false);
      setForm({ email: '', firstName: '', lastName: '', password: '' });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error al crear gestor');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u) => {
    if (u.id === currentUser?.id) { toast('No puedes eliminarte a ti mismo', 'error'); return; }
    if (!confirm(`¿Eliminar gestor ${u.email}?`)) return;
    try {
      await api.delete(`/users/${u.id}`);
      toast('Gestor eliminado');
      queryClient.invalidateQueries({ queryKey: ['users'] });
    } catch (err) {
      toast(err.response?.data?.error || 'Error al eliminar', 'error');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <UserCog size={24} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-gray-800">Gestores</h1>
        </div>
        <button
          onClick={() => { setShowModal(true); setFormError(''); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 text-sm"
        >
          <Plus size={18} /> Nuevo gestor
        </button>
      </div>

      <div className="bg-white rounded-xl shadow">
        {isLoading ? (
          <div className="p-8 text-center text-gray-400">Cargando...</div>
        ) : gestores.length === 0 ? (
          <div className="p-8 text-center text-gray-400">No hay gestores creados</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                <tr>
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Nombre</th>
                  <th className="text-left px-4 py-3">Rol</th>
                  <th className="text-left px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {gestores.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{u.email}</td>
                    <td className="px-4 py-3 text-gray-600 hidden sm:table-cell">
                      {u.firstName || u.lastName ? `${u.firstName || ''} ${u.lastName || ''}`.trim() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">{u.role}</span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} total={usersData?.total ?? 0} limit={LIMIT} onPage={setPage} />
      </div>

      {showModal && (
        <Modal title="Nuevo gestor" onClose={() => setShowModal(false)}>
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && <p className="text-red-500 text-sm bg-red-50 rounded p-2">{formError}</p>}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  value={form.firstName}
                  onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Apellidos</label>
                <input
                  value={form.lastName}
                  onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Contraseña *</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
                className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 border rounded-lg py-2 text-sm hover:bg-gray-50">Cancelar</button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-indigo-600 text-white rounded-lg py-2 text-sm hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? 'Creando...' : 'Crear gestor'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
