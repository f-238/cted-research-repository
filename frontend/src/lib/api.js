const API_URL = import.meta.env.VITE_API_URL || "";

export function getToken() {
  return localStorage.getItem("cte_token");
}

export function setToken(token) {
  if (token) localStorage.setItem("cte_token", token);
  else localStorage.removeItem("cte_token");
}

async function request(path, options = {}) {
  const headers = options.headers || {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch (err) {
    throw new Error("Unable to reach the server. Please check the backend URL, CORS settings, or network connection.");
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
  postForm: (path, form) => request(path, { method: "POST", body: form }),
  patchForm: (path, form) => request(path, { method: "PATCH", body: form }),
  del: (path) => request(path, { method: "DELETE" })
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
