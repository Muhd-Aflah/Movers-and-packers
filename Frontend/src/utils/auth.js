export function decodeJwt(token) {
  if (!token) return null;

  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");

    const padLength = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLength);

    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function getUserFromStorage() {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUserInStorage(user) {
  if (!user) return;
  localStorage.setItem("user", JSON.stringify(user));
}

export function clearAuthStorage() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getAuthFromStorage() {
  const token = localStorage.getItem("token");
  const payload = decodeJwt(token);

  const storedUser = getUserFromStorage();

  const role =
    payload?.role ??
    payload?.user?.role ??
    payload?.userRole ??
    storedUser?.role ??
    storedUser?.userRole ??
    null;

  const name =
    payload?.name ??
    payload?.user?.name ??
    payload?.username ??
    storedUser?.name ??
    storedUser?.username ??
    null;

  const email = payload?.email ?? payload?.user?.email ?? storedUser?.email ?? null;

  return { token, payload, user: storedUser, role, name, email };
}
