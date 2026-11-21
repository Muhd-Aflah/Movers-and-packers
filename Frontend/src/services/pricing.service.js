import { apiRequest } from "./api";

const pendingQuotes = new Map();

export const getPriceQuote = (booking) => {
  const key = JSON.stringify(booking);
  const pending = pendingQuotes.get(key);
  if (pending) return pending;

  const request = apiRequest("/api/pricing/quote", {
    method: "POST",
    body: JSON.stringify(booking),
  });
  pendingQuotes.set(key, request);
  const clearPending = () => {
    if (pendingQuotes.get(key) === request) pendingQuotes.delete(key);
  };
  request.then(clearPending, clearPending);
  return request;
};
