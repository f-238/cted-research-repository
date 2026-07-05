const API_URL = import.meta.env.VITE_API_URL || "";
const REQUEST_TIMEOUT_MS = 20000;

export function getToken() {
  return localStorage.getItem("cte_token") || sessionStorage.getItem("cte_token");
}

export function setToken(token, remember = true) {
  localStorage.removeItem("cte_token");
  sessionStorage.removeItem("cte_token");
  if (!token) return;
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem("cte_token", token);
}

async function request(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), options.timeoutMs || REQUEST_TIMEOUT_MS);
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
      cache: options.cache || "no-store"
    });
  } catch (err) {
    if (err.name === "AbortError") {
      throw new Error("The server took too long to respond. Please try again.");
    }
    throw new Error("Unable to reach the server. Please check the backend URL, CORS settings, or network connection.");
  } finally {
    window.clearTimeout(timeoutId);
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(error.detail || "Request failed");
  }
  return response.json();
}

export const api = {
  get: (path) => request(path),
  postJson: (path, body) => request(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }),
  putJson: (path, body) => request(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }),
  patchJson: (path, body) => request(path, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  }),
  postForm: (path, form) => request(path, { method: "POST", body: form }),
  patchForm: (path, form) => request(path, { method: "PATCH", body: form }),
  del: (path) => request(path, { method: "DELETE" }),
  delJson: (path, body) => request(path, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  })
};

export async function openSignedUrl(path) {
  try {
    const data = await api.get(path);
    if (!data?.url) throw new Error("Signed file URL was not returned.");
    window.open(data.url, "_blank", "noopener,noreferrer");
  } catch (err) {
    window.alert(err.message || "Unable to open this file.");
  }
}

export async function downloadFile(path, fallbackName) {
  const token = getToken();
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${API_URL}${path}`, { headers });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Download failed" }));
    throw new Error(error.detail || "Download failed");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^"]+)"?/i);
  const filename = match?.[1] || fallbackName || "download";
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
