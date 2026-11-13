import { apiRequest } from "./api";

export const createMove = (booking) =>
  apiRequest("/api/moves", {
    method: "POST",
    body: JSON.stringify(booking),
  });

export const getMove = (moveId) => apiRequest(`/api/moves/${moveId}`);
