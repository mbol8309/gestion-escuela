import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { BookOpen, User, LogOut } from 'lucide-react';

export default function PortalLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-56 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-lg font-bold text-indigo-600">Mi Portal</h1>
          <p className="text-sm text-gray-500 mt-1 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <NavLink to="/portal/mis-cursos" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <BookOpen size={18} /> Mis Cursos
          </NavLink>
          <NavLink to="/portal/perfil" className={({ isActive }) => `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'}`}>
            <User size={18} /> Mi Perfil
          </NavLink>
        </nav>
        <div className="p-4 border-t">
          <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 w-full rounded-lg text-sm text-red-600 hover:bg-red-50">
            <LogOut size={18} /> Salir
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-8">
        <Outlet />
      </main>
    </div>
  );
}
