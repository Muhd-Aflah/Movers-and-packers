import { apiRequest } from "./api";

export const providerService = {
  getCurrentJob: async () => {
    return apiRequest("/api/provider/current-job");
  },
  getAvailableMoves: async () => {
    return apiRequest("/api/provider/available-moves");
  },
  getMyJobs: async () => {
    return apiRequest("/api/provider/my-jobs");
  },
  acceptJob: async (moveId) => {
    return apiRequest(`/api/provider/moves/${moveId}/accept`, { method: "PUT" });
  },
  updateJobStatus: async (moveId, status) => {
    return apiRequest(`/api/provider/moves/${moveId}/status`, { method: "PUT", body: JSON.stringify({ status }) });
  },
};