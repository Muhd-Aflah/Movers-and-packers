import { apiRequest, apiRequestWithMeta } from "./api";

export const createMove = (booking) =>
  apiRequest("/api/moves", {
    method: "POST",
    body: JSON.stringify(booking),
  });

export const getMove = (moveId) => apiRequest(`/api/moves/${moveId}`);

export const getMyMovesPage = (page, limit = 10) =>
  apiRequestWithMeta(`/api/moves/my?page=${page}&limit=${limit}`);

export const acceptMovePricing = (moveId) =>
  apiRequest(`/api/moves/${moveId}/accept-pricing`, { method: "POST", body: JSON.stringify({}) });
