import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../services/api';

const schema = z.object({
  firstName: z.string().min(1, 'Requerido'),
  lastName: z.string().min(1, 'Requerido'),
  dni: z.string().min(1, 'Requerido'),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional(),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

export default function Activate() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    api.get(`/students/activate/${token}`)
      .then((r) => {
        setStudentData(r.data);
        reset({
          firstName: r.data.firstName || '',
          lastName: r.data.lastName || '',
          dni: r.data.dni || '',
          phone: r.data.phone || '',
          address: r.data.address || '',
          birthDate: r.data.birthDate ? r.data.birthDate.substring(0, 10) : '',
        });
      })
      .catch(() => setError('El enlace de activación no es válido o ha expirado.'))
      .finally(() => setLoading(false));
  }, [token, reset]);

  const onSubmit = async (data) => {
    setError('');
    const { confirmPassword, ...payload } = data;
    try {
      await api.put(`/students/activate/${token}`, payload);
      setDone(true);
      setTimeout(() => navigate('/login'), 4000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al activar cuenta');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-indigo-50">
        <div className="bg-white p-10 rounded-2xl shadow text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-500">Verificando enlace...</p>
        </div>
      </div>
    );
  }

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-green-50">
      <div className="bg-white p-10 rounded-2xl shadow text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-green-600">¡Inscripción confirmada!</h2>
        <p className="text-gray-500 mt-2">Tu cuenta está activa. Redirigiendo al login...</p>
        <p className="text-sm text-gray-400 mt-1">Accede con tu email y la contraseña que acabas de crear.</p>
      </div>
    </div>
  );

  if (error && !studentData) return (
    <div className="min-h-screen flex items-center justify-center bg-red-50">
      <div className="bg-white p-10 rounded-2xl shadow text-center">
        <div className="text-5xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-red-600">Enlace inválido</h2>
        <p className="text-gray-500 mt-2">{error}</p>
      </div>
    </div>
  );

  const enrollments = studentData?.Enrollments || [];

  return (
    <div className="min-h-screen flex items-center justify-center bg-indigo-50 py-8">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-lg">
        <h1 className="text-2xl font-bold text-indigo-600 mb-1">Confirma tu inscripción</h1>
        <p className="text-gray-500 mb-6 text-sm">Revisa tus datos y crea una contraseña para acceder a la plataforma.</p>

        {/* Assigned courses — readonly info */}
        {enrollments.length > 0 && (
          <div className="bg-indigo-50 rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-indigo-700 text-sm mb-2">📚 Cursos asignados</h3>
            <div className="space-y-2">
              {enrollments.map((enr) => {
                const courseName = enr.Course?.name || '—';
                const start = enr.startDate ? new Date(enr.startDate).toLocaleDateString('es-ES') : null;
                const end = enr.endDate ? new Date(enr.endDate).toLocaleDateString('es-ES') : null;
                return (
                  <div key={enr.id} className="text-sm">
                    <span className="font-medium text-indigo-800">{courseName}</span>
                    {start && (
                      <span className="text-indigo-500 ml-2 text-xs">
                        {start}{end ? ` → ${end}` : ''}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input {...register('firstName')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Apellidos</label>
              <input {...register('lastName')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
              {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName.message}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">DNI/NIE</label>
            <input {...register('dni')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            {errors.dni && <p className="text-red-500 text-xs mt-1">{errors.dni.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input {...register('phone')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input {...register('address')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Fecha de nacimiento</label>
            <input {...register('birthDate')} type="date" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="border-t pt-4">
            <label className="block text-sm font-medium mb-1">Nueva contraseña</label>
            <input {...register('password')} type="password" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmar contraseña</label>
            <input {...register('confirmPassword')} type="password" className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
          {error && <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">{error}</p>}
          <button type="submit" disabled={isSubmitting}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-60">
            {isSubmitting ? 'Confirmando...' : 'Confirmar mi inscripción'}
          </button>
        </form>
      </div>
    </div>
  );
}
