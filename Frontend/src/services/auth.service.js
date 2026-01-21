import { apiRequest } from "./api";

// LOGIN
export const login = async (email, password) => {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

export const signup = async (name, email, password, role = "user") => {
  return apiRequest("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      role,
    }),
  });
};

export const logout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
