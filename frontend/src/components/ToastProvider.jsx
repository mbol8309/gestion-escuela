import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';

const ToastContext = createContext(null);

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  const removeToast = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    const handler = (e) => addToast(e.detail, 'error');
    window.addEventListener('api-error', handler);
    return () => window.removeEventListener('api-error', handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-white text-sm min-w-[280px] ${t.type === 'error' ? 'bg-red-500' : 'bg-green-500'}`}>
            {t.type === 'error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
            <span className="flex-1">{t.message}</span>
            <button onClick={() => removeToast(t.id)}><X size={14} /></button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
