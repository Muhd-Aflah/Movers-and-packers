import { apiRequest } from "./api";
import { clearAuthStorage } from "../utils/auth";

// LOGIN
export const login = async (email, password) => {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const signup = async (name, email, password) => {
  return apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });
};

export const submitMoverApplication = (name, email, password) =>
  apiRequest("/api/auth/mover-application", {
    method: "POST",
    body: JSON.stringify({ name, email, password }),
  });

export const getCurrentProfile = () => apiRequest("/api/auth/profile");

export const logout = () => {
  clearAuthStorage();
};
