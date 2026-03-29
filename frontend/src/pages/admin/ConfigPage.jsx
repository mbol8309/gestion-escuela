import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { Settings } from 'lucide-react';

export default function ConfigPage() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useQuery({
    queryKey: ['config'],
    queryFn: () => api.get('/config').then((r) => r.data),
  });

  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm();

  useEffect(() => {
    if (config) reset(config);
  }, [config, reset]);

  const mutation = useMutation({
    mutationFn: (data) => api.put('/config', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
  });

  const onSubmit = async (data) => {
    await mutation.mutateAsync(data);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded animate-pulse w-48" />
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings size={22} className="text-indigo-600" />
        <h1 className="text-2xl font-bold text-gray-800">Configuración</h1>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre de la academia</label>
            <input
              {...register('academy_name')}
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="Mi Academia"
            />
            <p className="text-xs text-gray-400 mt-1">Aparece en PDFs generados</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">TTL token activación (horas)</label>
            <input
              {...register('activation_token_ttl_hours')}
              type="number"
              min="1"
              max="720"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="48"
            />
            <p className="text-xs text-gray-400 mt-1">Horas de validez del enlace de activación enviado al alumno</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">URL base del sitio</label>
            <input
              {...register('base_url')}
              type="url"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="http://100.117.252.96"
            />
            <p className="text-xs text-gray-400 mt-1">URL que se incluye en los emails de activación para que el alumno acceda al sitio</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email remitente (smtp_from)</label>
            <input
              {...register('smtp_from')}
              type="email"
              className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              placeholder="noreply@example.com"
            />
            <p className="text-xs text-gray-400 mt-1">Dirección de email que aparece como remitente en los envíos</p>
          </div>

          {mutation.isSuccess && (
            <p className="text-green-600 text-sm bg-green-50 px-3 py-2 rounded-lg">✅ Configuración guardada</p>
          )}
          {mutation.isError && (
            <p className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg">
              Error: {mutation.error?.response?.data?.error || mutation.error?.message}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              {isSubmitting ? 'Guardando...' : 'Guardar configuración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
