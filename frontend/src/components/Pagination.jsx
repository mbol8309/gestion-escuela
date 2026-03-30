export default function Pagination({ page, total, limit, onPage }) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between p-4 border-t text-sm">
      <span className="text-gray-500">{total} resultados · Página {page} de {totalPages}</span>
      <div className="flex gap-1">
        <button onClick={() => onPage(page - 1)} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">←</button>
        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
          const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
          return (
            <button key={p} onClick={() => onPage(p)}
              className={`px-3 py-1 border rounded ${p === page ? 'bg-indigo-600 text-white border-indigo-600' : 'hover:bg-gray-50'}`}>
              {p}
            </button>
          );
        })}
        <button onClick={() => onPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-40 hover:bg-gray-50">→</button>
      </div>
    </div>
  );
}
