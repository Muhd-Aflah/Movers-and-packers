import { apiRequest } from "./api";

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
