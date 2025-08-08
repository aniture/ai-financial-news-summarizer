// frontend/src/lib/api.js
const API_BASE =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_API_URL) ||
  "http://localhost:8000"; // fallback for local/run tests

// Simple wrapper to keep fetch calls consistent
async function request(path, { method = "GET", headers = {}, body } = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
  const opts = {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  };

  const res = await fetch(url, opts);
  // Optional: handle non-2xx
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text}`);
  }
  // Try JSON; if not JSON, return text
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const api = {
  get: (path, opts = {}) => request(path, { ...opts, method: "GET" }),
  post: (path, body, opts = {}) => request(path, { ...opts, method: "POST", body }),
  put: (path, body, opts = {}) => request(path, { ...opts, method: "PUT", body }),
  del: (path, opts = {}) => request(path, { ...opts, method: "DELETE" }),
  base: API_BASE,
};
