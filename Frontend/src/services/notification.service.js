import { apiRequest } from "./api";

export const getMyNotifications = (role) => {
  const audience = role === "mover" ? "mover" : "customer";
  return apiRequest(`/api/notifications/${audience}`);
};
