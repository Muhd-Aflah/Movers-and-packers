import { apiRequest } from "./api";

export const dashboardService = {
  getUserDashboard: async () => {
    const res = await apiRequest("/api/dashboard/user");
    return res.data ?? res; 
  },
};
