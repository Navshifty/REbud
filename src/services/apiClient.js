/*
  Thin fetch wrapper for the REbud API.

  API_ENABLED is false when VITE_API_URL is unset — every service then
  falls back to its in-browser mock backend, so the frontend stays
  runnable without the server.
*/

export const API_URL = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
export const API_ENABLED = API_URL !== "";

const TOKEN_KEY = "rebud.token";

export class ApiError extends Error {
  constructor(status, message, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

/* localStorage can be unavailable (private mode, blocked storage); never let that crash the app. */
export const tokenStore = {
  get() {
    try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
  },
  set(token) {
    try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
  },
  clear() {
    try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  },
};

/** Fired when the API rejects our token so the app can drop the session. */
export const UNAUTHORIZED_EVENT = "rebud:unauthorized";

/**
 * request("/projects", { method, body, formData, auth })
 * - `body` is JSON-encoded; `formData` is sent as multipart
 * - resolves with parsed JSON (null for 204)
 * - rejects with ApiError; status 0 means the server was unreachable
 */
export async function request(path, { method = "GET", body, formData, auth = true } = {}) {
  const headers = {};
  const token = auth ? tokenStore.get() : null;
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
    });
  } catch {
    throw new ApiError(0, "Can't reach the REbud API. Check that the server is running.");
  }

  if (res.status === 204) return null;

  let json = null;
  try { json = await res.json(); } catch { /* non-JSON body */ }

  if (!res.ok) {
    if (res.status === 401 && auth && token) {
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    throw new ApiError(res.status, json?.error?.message ?? res.statusText ?? "Request failed.", json?.error?.details);
  }
  return json;
}
