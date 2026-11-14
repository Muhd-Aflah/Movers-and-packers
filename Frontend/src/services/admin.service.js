import { apiRequest, apiRequestWithMeta } from "./api";

export const adminService = {
  getDashboardStats: async () => {
    return apiRequest("/api/admin/dashboard/stats");
  },
  getAllMoves: async () => {
    return apiRequest("/api/admin/moves");
  },
  getAllMovesPage: (page, limit = 10) => apiRequestWithMeta(`/api/admin/moves?page=${page}&limit=${limit}`),
  getPendingPackingEstimates: async () => apiRequest("/api/admin/moves/manual-estimates"),
  getPendingPackingEstimatesPage: (page, limit = 10) => apiRequestWithMeta(`/api/admin/moves/manual-estimates?page=${page}&limit=${limit}`),
  savePackingEstimate: async (moveId, estimate) => apiRequest(`/api/admin/moves/${moveId}/packing-estimate`, {
    method: "PUT",
    body: JSON.stringify(estimate),
  }),
  getAllUsers: async () => {
    return apiRequest("/api/admin/users");
  },
  getAllUsersPage: (page, limit = 10) => apiRequestWithMeta(`/api/admin/users?page=${page}&limit=${limit}`),
  getAllProviders: async () => {
    return apiRequest("/api/admin/providers");
  },
  getAllProvidersPage: (page, limit = 10) => apiRequestWithMeta(`/api/admin/providers?page=${page}&limit=${limit}`),
  getMovers: async (status = "pending") => {
    return apiRequest(`/api/admin/movers?status=${encodeURIComponent(status)}`);
  },
  getMoversPage: (status, page, limit = 10) => apiRequestWithMeta(`/api/admin/movers?status=${encodeURIComponent(status)}&page=${page}&limit=${limit}`),
  getMoverApplication: async (moverId) => apiRequest(`/api/admin/movers/${moverId}`),
  approveMover: async (moverId) => apiRequest(`/api/admin/movers/${moverId}/approve`, { method: "PUT", body: JSON.stringify({}) }),
  rejectMover: async (moverId, reason) => apiRequest(`/api/admin/movers/${moverId}/reject`, {
    method: "PUT",
    body: JSON.stringify({ reason }),
  }),
  getAllPayments: async () => {
    return apiRequest("/api/admin/payments");
  },
  getAllPaymentsPage: (page, limit = 10) => apiRequestWithMeta(`/api/admin/payments?page=${page}&limit=${limit}`),
  getPaymentReconciliations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/payments/reconciliation${query ? `?${query}` : ""}`);
  },
  reviewPaymentReconciliation: (id, review) => apiRequest(`/api/admin/payments/reconciliation/${encodeURIComponent(id)}/review`, {
    method: "POST", body: JSON.stringify(review),
  }),
  getPaymentOrderIntents: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/payments/reconciliation/order-intents${query ? `?${query}` : ""}`);
  },
  reviewPaymentOrderIntent: (id, review) => apiRequest(`/api/admin/payments/reconciliation/order-intents/${encodeURIComponent(id)}/review`, {
    method: "POST", body: JSON.stringify(review),
  }),
};
