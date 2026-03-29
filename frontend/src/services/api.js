import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    } else {
      const msg = err.response?.data?.error || err.response?.data?.message || 'Error inesperado';
      window.dispatchEvent(new CustomEvent('api-error', { detail: msg }));
    }
    return Promise.reject(err);
  }
);

export default api;
