export default function ResponsiveTable({ columns, data, onRowClick, loading }) {
  const titleCol = columns.find((c) => !c.isAction && !c.hideOnMobile);
  const subtitleKey = titleCol?.subtitle;
  const actionCols = columns.filter((c) => c.isAction);
  const visibleDesktopCols = columns.filter((c) => !c.isAction);

  if (loading) {
    return (
      <>
        {/* Desktop skeleton */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="text-left px-4 py-3">{c.label}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile skeleton */}
        <div className="md:hidden divide-y">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
              <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2" />
            </div>
          ))}
        </div>
      </>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400 text-sm">Sin resultados</div>
    );
  }

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`text-left px-4 py-3 ${c.isAction ? 'text-right' : ''}`}>
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y">
            {data.map((row, idx) => (
              <tr
                key={row.id ?? idx}
                className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick && onRowClick(row)}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 ${c.isAction ? 'text-right' : ''}`}
                    onClick={c.isAction ? (e) => e.stopPropagation() : undefined}
                  >
                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y">
        {data.map((row, idx) => (
          <div
            key={row.id ?? idx}
            className={`p-4 ${onRowClick ? 'cursor-pointer active:bg-gray-50' : ''}`}
            onClick={() => onRowClick && onRowClick(row)}
          >
            <div className="flex justify-between items-start">
              <div className="flex-1 min-w-0">
                {titleCol && (
                  <p className="font-semibold text-gray-900 truncate">
                    {titleCol.render ? titleCol.render(row) : (row[titleCol.key] ?? '—')}
                  </p>
                )}
                {subtitleKey && row[subtitleKey] && (
                  <p className="text-sm text-gray-500 truncate mt-0.5">{row[subtitleKey]}</p>
                )}
                {/* Non-hidden, non-action, non-title columns shown as secondary info */}
                {visibleDesktopCols
                  .filter((c) => c.key !== titleCol?.key && !c.hideOnMobile)
                  .map((c) => (
                    <div key={c.key} className="text-sm text-gray-600 mt-1">
                      {c.render ? c.render(row) : (row[c.key] ?? '—')}
                    </div>
                  ))}
              </div>
            </div>
            {actionCols.length > 0 && (
              <div
                className="mt-3 flex gap-2 flex-wrap"
                onClick={(e) => e.stopPropagation()}
              >
                {actionCols.map((c) => (
                  <div key={c.key}>
                    {c.render ? c.render(row) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
