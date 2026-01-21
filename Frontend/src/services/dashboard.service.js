import { apiRequest } from "./api";

export const dashboardService = {
  getUserDashboard: async () => {
    return apiRequest("/api/dashboard/user");
  },
};