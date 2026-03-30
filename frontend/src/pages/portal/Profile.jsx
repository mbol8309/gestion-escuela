import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';
import { Eye, EyeOff, Check } from 'lucide-react';

const profileSchema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  dni: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Requerido'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(1, 'Requerido'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

function FieldError({ error }) {
  if (!error) return null;
  return <p className="text-red-500 text-xs mt-1">{error.message}</p>;
}

function PasswordInput({ label, error, ...props }) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-sm font-medium mb-1 text-gray-700">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          className={`w-full border rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${error ? 'border-red-400' : 'border-gray-300'}`}
          {...props}
        />
        <button type="button" onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <FieldError error={error} />
    </div>
  );
}

export default function Profile() {
  const { user } = useAuthStore();
  const [student, setStudent] = useState(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState(null);

  const profileForm = useForm({ resolver: zodResolver(profileSchema) });
  const passwordForm = useForm({ resolver: zodResolver(passwordSchema) });

  useEffect(() => {
    api.get('/students/me').then((r) => {
      setStudent(r.data);
      const d = r.data;
      profileForm.reset({
        firstName: d.firstName || '',
        lastName: d.lastName || '',
        dni: d.dni || '',
        phone: d.phone || '',
        address: d.address || '',
        birthDate: d.birthDate ? d.birthDate.split('T')[0] : '',
      });
    }).catch(() => {
      // fallback: use authStore data + GET /api/students/:id
      if (user?.studentId) {
        api.get(`/students/${user.studentId}`).then((r) => {
          setStudent(r.data);
          const d = r.data;
          profileForm.reset({
            firstName: d.firstName || '',
            lastName: d.lastName || '',
            dni: d.dni || '',
            phone: d.phone || '',
            address: d.address || '',
            birthDate: d.birthDate ? d.birthDate.split('T')[0] : '',
          });
        });
      }
    });
  }, [user]);

  const onSaveProfile = async (data) => {
    const id = student?.id || user?.studentId;
    await api.put(`/students/${id}`, data);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const onChangePassword = async (data) => {
    setPwError(null);
    try {
      await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPwSaved(true);
      passwordForm.reset();
      setTimeout(() => setPwSaved(false), 3000);
    } catch (err) {
      setPwError(err.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  if (!student) return <div className="text-center py-10 text-gray-400">Cargando...</div>;

  const pf = profileForm;
  const pw = passwordForm;

  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800">Mi Perfil</h1>

      {/* Datos personales */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Datos personales</h2>
        <form onSubmit={pf.handleSubmit(onSaveProfile)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Nombre</label>
              <input {...pf.register('firstName')}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${pf.formState.errors.firstName ? 'border-red-400' : 'border-gray-300'}`} />
              <FieldError error={pf.formState.errors.firstName} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-gray-700">Apellidos</label>
              <input {...pf.register('lastName')}
                className={`w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none ${pf.formState.errors.lastName ? 'border-red-400' : 'border-gray-300'}`} />
              <FieldError error={pf.formState.errors.lastName} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Email</label>
            <input value={student.email || user?.email || ''} readOnly
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">DNI / NIE</label>
            <input {...pf.register('dni')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Teléfono</label>
            <input {...pf.register('phone')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Dirección</label>
            <input {...pf.register('address')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-700">Fecha de nacimiento</label>
            <input type="date" {...pf.register('birthDate')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" disabled={pf.formState.isSubmitting}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60 flex items-center gap-2">
              {pf.formState.isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {profileSaved && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Check size={16} /> Guardado
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Cambio de contraseña */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Cambiar contraseña</h2>
        <form onSubmit={pw.handleSubmit(onChangePassword)} className="space-y-4">
          <PasswordInput label="Contraseña actual"
            error={pw.formState.errors.currentPassword}
            {...pw.register('currentPassword')} />
          <PasswordInput label="Nueva contraseña"
            error={pw.formState.errors.newPassword}
            {...pw.register('newPassword')} />
          <PasswordInput label="Confirmar nueva contraseña"
            error={pw.formState.errors.confirmPassword}
            {...pw.register('confirmPassword')} />
          {pwError && <p className="text-red-500 text-sm">{pwError}</p>}
          <div className="flex items-center gap-4 pt-2">
            <button type="submit" disabled={pw.formState.isSubmitting}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
              {pw.formState.isSubmitting ? 'Cambiando...' : 'Cambiar contraseña'}
            </button>
            {pwSaved && (
              <span className="flex items-center gap-1 text-green-600 text-sm">
                <Check size={16} /> Contraseña actualizada
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
