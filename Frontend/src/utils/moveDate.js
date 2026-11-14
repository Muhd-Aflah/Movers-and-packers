const INDIA_TIME_ZONE = "Asia/Kolkata";

export const formatMoveDate = (value, locale = "en-IN") => {
  if (!value) return "Date not set";
  const date = value instanceof Date ? value : new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat(locale, {
    timeZone: INDIA_TIME_ZONE,
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
};
