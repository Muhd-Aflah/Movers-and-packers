export function PaginationControls({ pagination, page, onPageChange, disabled = false, label = "Pagination" }) {
  const metadataAvailable = Number.isSafeInteger(pagination?.total) && Number.isSafeInteger(pagination?.totalPages);
  const totalPages = metadataAvailable
    ? Math.max(1, pagination.totalPages)
    : null;
  const currentPage = page ?? pagination?.page ?? 1;
  const hasPrevious = currentPage > 1;
  const hasNext = Number.isSafeInteger(pagination?.totalPages)
    ? currentPage < pagination.totalPages
    : pagination?.page === currentPage && Boolean(pagination?.hasNextPage);

  return (
    <nav aria-label={label} className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 text-sm dark:border-slate-700">
      <p aria-live="polite" className="text-slate-600 dark:text-slate-300">
        {metadataAvailable
          ? <>Page {currentPage} of {totalPages} <span className="mx-1" aria-hidden="true">·</span> {pagination.total} records</>
          : <>Page {currentPage} <span className="mx-1" aria-hidden="true">·</span> Showing {pagination?.loadedCount ?? 0} records; total count unavailable</>}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          aria-label="Go to previous page"
          disabled={disabled || !hasPrevious}
          className="min-h-11 rounded-control border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-blue-400"
        >Previous</button>
        <button
          type="button"
          onClick={() => onPageChange(metadataAvailable ? Math.min(totalPages, currentPage + 1) : currentPage + 1)}
          aria-label="Go to next page"
          disabled={disabled || !hasNext}
          className="min-h-11 rounded-control border border-slate-300 px-3 font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-blue-400"
        >Next</button>
      </div>
    </nav>
  );
}
