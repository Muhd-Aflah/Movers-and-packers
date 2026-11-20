import { apiRequest } from "./api";

export const getMyNotifications = (role) => {
  const audience = role === "mover" ? "mover" : role === "admin" ? "admin" : "customer";
  return apiRequest(`/api/notifications/${audience}`);
};

export const markNotificationRead = (notificationId) =>
  apiRequest(`/api/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PATCH", body: JSON.stringify({}) });
