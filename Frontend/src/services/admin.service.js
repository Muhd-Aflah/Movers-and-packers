import { apiRequest } from "./api";

export const adminService = {
  getDashboardStats: async () => {
    return apiRequest("/api/admin/dashboard/stats");
  },
};