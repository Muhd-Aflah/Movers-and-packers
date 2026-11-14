import { apiRequest, apiRequestWithMeta } from "./api";

export const providerService = {
  getCurrentJob: async () => {
    return apiRequest("/api/provider/current-job");
  },
  getAvailableMoves: async () => {
    return apiRequest("/api/provider/available-moves");
  },
  getAvailableMovesPage: (page, limit = 10) => apiRequestWithMeta(`/api/provider/available-moves?page=${page}&limit=${limit}`),
  getMyJobs: async () => {
    return apiRequest("/api/provider/my-jobs");
  },
  getMyJobsPage: (page, limit = 10) => apiRequestWithMeta(`/api/provider/my-jobs?page=${page}&limit=${limit}`),
  acceptJob: async (moveId) => {
    return apiRequest(`/api/provider/moves/${moveId}/accept`, { method: "PUT" });
  },
  updateJobStatus: async (moveId, action) => {
    const body = typeof action === "string" ? { status: action } : action;
    return apiRequest(`/api/provider/moves/${moveId}/status`, { method: "PUT", body: JSON.stringify(body) });
  },
};
