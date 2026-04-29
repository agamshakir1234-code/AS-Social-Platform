export default function Table({ columns, data, loading, emptyMessage = 'No data found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-bg-border">
            {columns.map((col) => (
              <th key={col.key} className="table-head">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            [...Array(5)].map((_, i) => (
              <tr key={i} className="border-b border-bg-border">
                {columns.map((col) => (
                  <td key={col.key} className="table-cell">
                    <div className="h-4 bg-bg-hover rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))
          ) : data?.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-16 text-center text-slate-500 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data?.map((row, i) => (
              <tr key={row.id || i} className="table-row">
                {columns.map((col) => (
                  <td key={col.key} className="table-cell">
                    {col.render ? col.render(row[col.key], row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
