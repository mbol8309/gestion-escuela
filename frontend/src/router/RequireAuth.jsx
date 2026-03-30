import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export function RequireAuth({ children, roles }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) {
    // Smart redirect based on role
    if (user.role === 'alumno') return <Navigate to="/portal/mis-cursos" replace />;
    if (['admin', 'gestor'].includes(user.role)) return <Navigate to="/admin" replace />;
    return <Navigate to="/unauthorized" replace />;
  }
  return children;
}
