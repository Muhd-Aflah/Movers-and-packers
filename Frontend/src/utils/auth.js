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

const notifyAuthChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event("swiftmove:auth-changed"));
};

export function setAuth({ token, user }) {
  localStorage.setItem("token", token);
  if (user) {
    localStorage.setItem("user", JSON.stringify(user));
  }
  notifyAuthChanged();
}

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  if (typeof window !== "undefined") queueMicrotask(notifyAuthChanged);
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

  const storedUser = localStorage.getItem("user");
  let user = null;
  if (storedUser) {
    try {
      user = JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
    }
  }

  return {
    token,
    role: payload.role, // ONLY source of truth
    user,
  };
}
