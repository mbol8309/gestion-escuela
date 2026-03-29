import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LayoutDashboard, BookOpen, Users, ClipboardList, LogOut, Menu, X, ChevronLeft, Settings } from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const links = [
    { to: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
    { to: '/admin/cursos', icon: BookOpen, label: 'Cursos' },
    { to: '/admin/alumnos', icon: Users, label: 'Alumnos' },
    { to: '/admin/inscripciones', icon: ClipboardList, label: 'Inscripciones' },
    { to: '/admin/configuracion', icon: Settings, label: 'Configuración' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b flex items-center justify-between">
        {sidebarOpen ? (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-indigo-600 truncate">Gestión Escuela</h1>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{user?.role}</span>
          </div>
        ) : (
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">G</span>
          </div>
        )}
        {/* Toggle button - desktop */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden md:flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0"
        >
          {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
              } ${!sidebarOpen ? 'justify-center' : ''}`
            }
            title={!sidebarOpen ? label : undefined}
          >
            <Icon size={18} className="flex-shrink-0" />
            {sidebarOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 border-t">
        <button
          onClick={handleLogout}
          className={`flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors ${!sidebarOpen ? 'justify-center' : ''}`}
          title={!sidebarOpen ? 'Salir' : undefined}
        >
          <LogOut size={18} className="flex-shrink-0" />
          {sidebarOpen && <span>Salir</span>}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar desktop */}
      <aside
        className={`hidden md:flex flex-col bg-white shadow-lg transition-all duration-300 ease-in-out flex-shrink-0 ${
          sidebarOpen ? 'w-56' : 'w-16'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Sidebar mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-30 transform transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="bg-white shadow-sm px-4 py-3 flex items-center gap-3 flex-shrink-0">
          {/* Hamburger mobile */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h2 className="text-sm font-medium text-gray-600 truncate">
            {user?.role === 'admin' ? 'Administrador' : 'Gestor'} — {user?.email}
          </h2>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
        <footer className="flex-shrink-0 bg-white border-t px-4 py-2 text-xs text-gray-400 text-right">
          Gestión Escuela v{__APP_VERSION__}
        </footer>
      </div>
    </div>
  );
}
