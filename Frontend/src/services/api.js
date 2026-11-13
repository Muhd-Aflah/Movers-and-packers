import { APP_CONFIG } from "../constants/config";

export const API_BASE_URL = APP_CONFIG.api.baseUrl;

export const apiRequest = async (endpoint, options = {}) => {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_URL is not configured");
  }

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), APP_CONFIG.api.timeout);
  let response;
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${endpoint}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
  } catch (error) {
    if (error.name === "AbortError") throw new Error("API request timed out");
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }

  const contentType = response.headers.get("content-type") || "";
  const data = response.status === 204
    ? null
    : contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    throw new Error(data?.message || data || "API error");
  }

  return data;
};
