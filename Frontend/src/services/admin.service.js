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
  getAllPayments: async () => {
    return apiRequest("/api/admin/payments");
  },
};