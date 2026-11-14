export function parsePaginationHeader(value) {
  if (typeof value !== "string" || !value.trim()) return null;

  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
    const { page, limit, total, totalPages, hasNextPage, hasPrevPage } = parsed;
    if (!Number.isSafeInteger(page) || page < 1 ||
      !Number.isSafeInteger(limit) || limit < 1 ||
      !Number.isSafeInteger(total) || total < 0 ||
      !Number.isSafeInteger(totalPages) || totalPages !== Math.ceil(total / limit) ||
      typeof hasNextPage !== "boolean" || typeof hasPrevPage !== "boolean") return null;
    return { page, limit, total, totalPages, hasNextPage, hasPrevPage };
  } catch {
    return null;
  }
}
