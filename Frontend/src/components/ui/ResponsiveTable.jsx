export function ResponsiveTable({ caption = "Data table", columns = [], rows = [], getRowKey = (row, index) => row._id ?? row.id ?? index, emptyMessage = "No records to display" }) {
  return (
    <div className="overflow-hidden rounded-card border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
      {rows.length === 0 ? (
        <p role="status" className="p-5 text-sm text-slate-600 dark:text-slate-300">{emptyMessage}</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left text-sm">
              <caption className="sr-only">{caption}</caption>
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                <tr>{columns.map((column) => <th key={column.key} scope="col" className="h-[60px] px-4 py-3 font-semibold">{column.label}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {rows.map((row, index) => (
                  <tr key={getRowKey(row, index)} className="h-[60px]">
                    {columns.map((column) => <td key={column.key} className="h-[60px] px-4 py-3 align-middle">{column.render ? column.render(row) : row[column.key]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div role="group" className="divide-y divide-slate-200 md:hidden dark:divide-slate-700" aria-label={`${caption} list`}>
            {rows.map((row, index) => (
              <dl key={getRowKey(row, index)} className="grid grid-cols-[minmax(6rem,auto)_1fr] gap-x-4 gap-y-2 p-4 text-sm">
                {columns.map((column) => (
                  <div key={column.key} className="contents">
                    <dt className="font-medium text-slate-600 dark:text-slate-300">{column.label}</dt>
                    <dd className="min-w-0 break-words">{column.render ? column.render(row) : row[column.key]}</dd>
                  </div>
                ))}
              </dl>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
