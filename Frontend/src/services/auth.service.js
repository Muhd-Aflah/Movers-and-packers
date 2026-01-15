import { apiRequest } from "./api";

// login
export const login = (email, password) => {
  return apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
};

// signup
export const signup = (name, email, password, role) => {
  return apiRequest("/auth/signup", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      role,
    }),
  });
};
