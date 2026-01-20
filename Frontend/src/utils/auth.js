export function decodeJwt(token) {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(base64);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function setAuth({ token, user }) {
  localStorage.setItem("token", token);
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
}

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getAuthFromStorage() {
  const token = localStorage.getItem("token");
  if (!token) {
    return { token: null, role: null, user: null };
  }

  const payload = decodeJwt(token);

  // Invalid or expired token
  if (!payload || (payload.exp && payload.exp * 1000 < Date.now())) {
    clearAuthStorage();
    return { token: null, role: null, user: null };
  }

  const user = localStorage.getItem("user");

  return {
    token,
    role: payload.role, // ONLY source of truth
    user: user ? JSON.parse(user) : null,
  };
}
