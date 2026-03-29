import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { RequireAuth } from './RequireAuth';
import Login from '../pages/Login';
import Activate from '../pages/Activate';
import Dashboard from '../pages/admin/Dashboard';
import Courses from '../pages/admin/Courses';
import Students from '../pages/admin/Students';
import Enrollments from '../pages/admin/Enrollments';
import StudentDetail from '../pages/admin/StudentDetail';
import CourseDetail from '../pages/admin/CourseDetail';
import ConfigPage from '../pages/admin/ConfigPage';
import TemplateEditor from '../pages/admin/TemplateEditor';
import MyCourses from '../pages/portal/MyCourses';
import Profile from '../pages/portal/Profile';
import AdminLayout from '../components/AdminLayout';
import PortalLayout from '../components/PortalLayout';

function RootRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'alumno') return <Navigate to="/portal/mis-cursos" replace />;
  return <Navigate to="/admin" replace />;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route path="/activate/:token" element={<Activate />} />
        <Route path="/unauthorized" element={<div className="p-8 text-center text-red-600 text-xl">Acceso no autorizado</div>} />

        <Route path="/admin" element={<RequireAuth roles={['admin', 'gestor']}><AdminLayout /></RequireAuth>}>
          <Route index element={<Dashboard />} />
          <Route path="cursos" element={<Courses />} />
          <Route path="alumnos" element={<Students />} />
          <Route path="alumnos/:id" element={<StudentDetail />} />
          <Route path="cursos/:id" element={<CourseDetail />} />
          <Route path="cursos/:id/plantillas/:templateId" element={<TemplateEditor />} />
          <Route path="inscripciones" element={<Enrollments />} />
          <Route path="configuracion" element={<ConfigPage />} />
        </Route>

        <Route path="/portal" element={<RequireAuth roles={['alumno']}><PortalLayout /></RequireAuth>}>
          <Route path="mis-cursos" element={<MyCourses />} />
          <Route path="perfil" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
