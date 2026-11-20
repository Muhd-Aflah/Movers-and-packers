import { APP_CONFIG } from "../constants/config";
import { parsePaginationHeader } from "../utils/pagination";

export const API_BASE_URL = APP_CONFIG.api.baseUrl;

const request = async (endpoint, options = {}) => {
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
  const timeoutMs = Number.isFinite(options.timeoutMs) && options.timeoutMs > 0
    ? Math.min(options.timeoutMs, 30_000)
    : APP_CONFIG.api.timeout;
  const externalSignal = options.signal;
  const { timeoutMs: _timeoutMs, signal: _signal, ...fetchOptions } = options;
  let timedOut = false;
  const abortFromExternalSignal = () => controller.abort(externalSignal.reason);
  if (externalSignal?.aborted) abortFromExternalSignal();
  else externalSignal?.addEventListener("abort", abortFromExternalSignal, { once: true });
  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  let response;
  let data;
  try {
    response = await fetch(`${API_BASE_URL.replace(/\/$/, "")}${endpoint}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
    const contentType = response.headers.get("content-type") || "";
    data = response.status === 204
      ? null
      : contentType.includes("application/json")
        ? await response.json()
        : await response.text();
  } catch (error) {
    if (timedOut) {
      const timeoutError = new Error("The request took too long. Check your connection and try again.");
      timeoutError.code = "REQUEST_TIMEOUT";
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortFromExternalSignal);
  }

  if (!response.ok) {
    const error = new Error(data?.message || data || "API error");
    error.status = response.status;
    if (data && typeof data === "object") {
      error.code = data.code;
      error.details = data.details;
    }
    throw error;
  }

  const pagination = parsePaginationHeader(response.headers.get("X-Pagination"));
  return { data, pagination };
};

// Keep the established response shape for existing consumers. List pages that
// need pagination metadata can opt into this companion method.
export const apiRequest = async (endpoint, options = {}) => (await request(endpoint, options)).data;

export const apiRequestWithMeta = request;
