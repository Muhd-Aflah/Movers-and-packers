import { useCallback, useEffect, useRef, useState } from "react";

export function usePaginatedData(fetchPage, pageSize = 10) {
  const [page, setPage] = useState(1);
  const [items, setItems] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);
  const activeFetcher = useRef(fetchPage);
  const lastPageWithoutMetadata = useRef(null);

  if (activeFetcher.current !== fetchPage) {
    activeFetcher.current = fetchPage;
    lastPageWithoutMetadata.current = null;
  }

  const reload = useCallback(async () => {
    const currentRequest = ++requestId.current;
    setItems([]);
    setLoading(true);
    setError("");
    setPagination((current) => current ? {
      ...current,
      page,
      hasPrevPage: page > 1,
      hasNextPage: current.metadataAvailable === false ? false : page < current.totalPages,
    } : null);
    try {
      const result = await fetchPage(page);
      if (currentRequest !== requestId.current) return;
      if (!Array.isArray(result?.data)) throw new Error("The paginated endpoint did not return a record list");
      setItems(result.data);
      if (result.pagination) {
        lastPageWithoutMetadata.current = null;
        setPagination(result.pagination);
        if (page > Math.max(1, result.pagination.totalPages)) {
          setPage(Math.max(1, result.pagination.totalPages));
        }
      } else {
        if (result.data.length < pageSize) {
          lastPageWithoutMetadata.current = lastPageWithoutMetadata.current === null
            ? page
            : Math.min(lastPageWithoutMetadata.current, page);
        }
        if (result.data.length === 0 && page > 1) {
          lastPageWithoutMetadata.current = Math.min(lastPageWithoutMetadata.current ?? page - 1, page - 1);
          setPage(page - 1);
        }
        setPagination({
          page,
          limit: pageSize,
          total: null,
          totalPages: null,
          hasNextPage: lastPageWithoutMetadata.current === null
            ? result.data.length === pageSize
            : page < lastPageWithoutMetadata.current,
          hasPrevPage: page > 1,
          metadataAvailable: false,
          loadedCount: result.data.length,
        });
      }
    } catch (requestError) {
      if (currentRequest === requestId.current) setError(requestError.message || "Could not load records");
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, [fetchPage, page, pageSize]);

  useEffect(() => {
    reload();
    return () => { requestId.current += 1; };
  }, [reload]);

  return { page, setPage, items, setItems, pagination, loading, error, setError, reload };
}
