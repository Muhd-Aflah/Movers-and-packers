import { apiRequest, apiRequestWithMeta } from "./api";

export const createOrder = (moveId) =>
  apiRequest("/api/payments/create-order", {
    method: "POST",
    body: JSON.stringify({ moveId }),
  });

export const verifyPayment = (paymentData) =>
  apiRequest("/api/payments/verify", {
    method: "POST",
    body: JSON.stringify(paymentData),
  });

export const getMyPaymentsPage = (page, limit = 10) =>
  apiRequestWithMeta(`/api/payments/my?page=${page}&limit=${limit}`);

export const getPaymentReceipt = (paymentId) =>
  apiRequest(`/api/payments/${encodeURIComponent(paymentId)}/receipt`);
