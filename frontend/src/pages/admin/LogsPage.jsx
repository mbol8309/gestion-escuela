import { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { FileText, Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

export default function LogsPage() {
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [lines, setLines] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loading, setLoading] = useState(false);
  const LIMIT = 200;

  useEffect(() => {
    api.get('/logs/files').then(r => setFiles(r.data.data || []));
  }, []);

  const fetchLines = useCallback(async (filename, p, s) => {
    if (!filename) return;
    setLoading(true);
    try {
      const res = await api.get(`/logs/files/${encodeURIComponent(filename)}`, {
        params: { page: p, limit: LIMIT, search: s },
      });
      setLines(res.data.data || []);
      setTotal(res.data.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedFile) fetchLines(selectedFile, page, search);
  }, [selectedFile, page, search, fetchLines]);

  const handleFileSelect = (name) => {
    setSelectedFile(name);
    setPage(1);
    setSearch('');
    setSearchInput('');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  const totalPages = Math.ceil(total / LIMIT);

  const levelColor = (line) => {
    if (line.includes(' ERROR ')) return 'text-red-600';
    if (line.includes(' WARN ')) return 'text-yellow-600';
    if (line.includes(' INFO ')) return 'text-green-700';
    return 'text-gray-700';
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold text-gray-800">Logs del sistema</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Lista de ficheros */}
        <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 bg-gray-50 border-b text-sm font-medium text-gray-600">Ficheros de log</div>
          {files.length === 0 ? (
            <div className="p-4 text-sm text-gray-400">No hay ficheros de log aún</div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {files.map(f => (
                <li key={f.name}>
                  <button
                    onClick={() => handleFileSelect(f.name)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 ${selectedFile === f.name ? 'bg-blue-100 text-blue-700 font-medium' : 'text-gray-700'}`}
                  >
                    <FileText size={14} className="flex-shrink-0" />
                    <div className="overflow-hidden">
                      <div className="truncate">{f.name}</div>
                      <div className="text-xs text-gray-400">{(f.size / 1024).toFixed(1)} KB</div>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Visor */}
        <div className="md:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!selectedFile ? (
            <div className="p-8 text-center text-gray-400">Selecciona un fichero de log</div>
          ) : (
            <>
              <div className="p-3 bg-gray-50 border-b flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-600 mr-auto">{selectedFile}</span>
                <form onSubmit={handleSearch} className="flex items-center gap-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      value={searchInput}
                      onChange={e => setSearchInput(e.target.value)}
                      placeholder="Buscar en log..."
                      className="pl-7 pr-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
                    />
                  </div>
                  <button type="submit" className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">Buscar</button>
                  {search && (
                    <button type="button" onClick={() => { setSearchInput(''); setSearch(''); setPage(1); }} className="px-3 py-1.5 text-sm bg-gray-200 rounded-lg hover:bg-gray-300">Limpiar</button>
                  )}
                </form>
                <button onClick={() => fetchLines(selectedFile, page, search)} className="p-1.5 text-gray-500 hover:text-blue-600">
                  <RefreshCw size={15} />
                </button>
              </div>

              <div className="p-3 font-mono text-xs overflow-auto max-h-[60vh] space-y-0.5 bg-gray-900">
                {loading ? (
                  <div className="text-gray-400 p-4">Cargando...</div>
                ) : lines.length === 0 ? (
                  <div className="text-gray-400 p-4">{search ? 'Sin resultados para esa búsqueda' : 'Fichero vacío'}</div>
                ) : (
                  lines.map((line, i) => (
                    <div key={i} className={`${levelColor(line)} whitespace-pre-wrap break-all leading-5`}>{line}</div>
                  ))
                )}
              </div>

              {totalPages > 1 && (
                <div className="p-3 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600">
                  <span>{total} líneas {search && `(filtradas)`} · Página {page}/{totalPages}</span>
                  <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-1 disabled:opacity-40 hover:text-blue-600">
                      <ChevronLeft size={16} />
                    </button>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-1 disabled:opacity-40 hover:text-blue-600">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
