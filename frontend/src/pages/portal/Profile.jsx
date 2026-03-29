import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../../store/authStore';
import api from '../../services/api';

export default function Profile() {
  const { user } = useAuthStore();
  const [student, setStudent] = useState(null);
  const [saved, setSaved] = useState(false);
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm();

  useEffect(() => {
    if (user?.studentId) {
      api.get(`/students/${user.studentId}`).then((r) => {
        setStudent(r.data);
        reset(r.data);
      });
    }
  }, [user]);

  const onSubmit = async (data) => {
    await api.put(`/students/${user.studentId}`, data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  if (!student) return <div className="text-center py-10 text-gray-400">Cargando...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mi Perfil</h1>
      <div className="bg-white rounded-xl shadow p-6 max-w-2xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre</label>
              <input {...register('firstName')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Apellidos</label>
              <input {...register('lastName')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input {...register('email')} type="email" disabled className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">DNI/NIE</label>
            <input {...register('dni')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Teléfono</label>
            <input {...register('phone')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Dirección</label>
            <input {...register('address')} className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
          </div>
          <div className="flex items-center gap-4">
            <button type="submit" disabled={isSubmitting}
              className="bg-indigo-600 text-white px-6 py-2.5 rounded-lg hover:bg-indigo-700 disabled:opacity-60">
              {isSubmitting ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span className="text-green-600 text-sm">✅ Guardado</span>}
          </div>
        </form>
      </div>
    </div>
  );
}
