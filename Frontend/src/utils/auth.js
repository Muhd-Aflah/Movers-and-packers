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

export function setUserInStorage(user) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUserFromStorage() {
  const user = localStorage.getItem("user");
  return user ? JSON.parse(user) : null;
}

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getAuthFromStorage() {
  const token = localStorage.getItem("token");
  const user = getUserFromStorage();
  const payload = decodeJwt(token);

  return {
    token,
    user,
    role: payload?.role || user?.role || null,
  };
}
