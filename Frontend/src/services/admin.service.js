import { apiRequest } from "./api";

export const adminService = {
  getDashboardStats: async () => {
    return apiRequest("/api/admin/dashboard/stats");
  },
  getAllMoves: async () => {
    return apiRequest("/api/admin/moves");
  },
  getAllUsers: async () => {
    return apiRequest("/api/admin/users");
  },
  getAllProviders: async () => {
    return apiRequest("/api/admin/providers");
  },
  getMovers: async (status = "pending") => {
    return apiRequest(`/api/admin/movers?status=${encodeURIComponent(status)}`);
  },
  getMoverApplication: async (moverId) => apiRequest(`/api/admin/movers/${moverId}`),
  approveMover: async (moverId) => apiRequest(`/api/admin/movers/${moverId}/approve`, { method: "PUT", body: JSON.stringify({}) }),
  rejectMover: async (moverId, reason) => apiRequest(`/api/admin/movers/${moverId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  }),
  getAllPayments: async () => {
    return apiRequest("/api/admin/payments");
  },
};
