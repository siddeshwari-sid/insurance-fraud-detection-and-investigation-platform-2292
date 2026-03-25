/**
 * Lightweight API client for the Express backend.
 *
 * Env:
 * - REACT_APP_API_BASE: Base URL for backend, e.g. https://...:3001
 */

const API_BASE =
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:3001";

async function readJsonOrText(res) {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) return res.json();
  return res.text();
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const body = await readJsonOrText(res);
    const message =
      typeof body === "string"
        ? body
        : body?.error || body?.message || "Request failed";
    const err = new Error(message);
    err.status = res.status;
    err.body = body;
    throw err;
  }

  // 204 support
  if (res.status === 204) return null;
  return readJsonOrText(res);
}

function toQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    search.set(k, String(v));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

// PUBLIC_INTERFACE
export const api = {
  /** PUBLIC_INTERFACE
   * Upload a CSV file for ingestion and scoring.
   * @param {File} file CSV file
   * @returns {Promise<any>} backend response
   */
  async uploadClaimsCsv(file) {
    const form = new FormData();
    form.append("file", file);
    return request("/api/claims/upload", {
      method: "POST",
      body: form
    });
  },

  /** PUBLIC_INTERFACE
   * List claims with optional query params (backend may ignore unknown params).
   * @param {{q?:string, risk?:string, status?:string, sort?:string, order?:string, limit?:number, offset?:number}} params
   */
  async listClaims(params) {
    return request(`/api/claims${toQuery(params)}`, { method: "GET" });
  },

  /** PUBLIC_INTERFACE
   * Fetch claim details by id.
   * @param {string} id
   */
  async getClaim(id) {
    return request(`/api/claims/${encodeURIComponent(id)}`, { method: "GET" });
  },

  /** PUBLIC_INTERFACE
   * Update claim outcome.
   * @param {string} id
   * @param {{outcome:string, notes?:string}} payload
   */
  async setOutcome(id, payload) {
    return request(`/api/claims/${encodeURIComponent(id)}/outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
  },

  /** PUBLIC_INTERFACE
   * Queue endpoint for investigator triage.
   * @param {{risk?:string, status?:string}} params
   */
  async getQueue(params) {
    return request(`/api/queue${toQuery(params)}`, { method: "GET" });
  },

  /** PUBLIC_INTERFACE
   * Summary reporting for dashboard.
   */
  async getSummary() {
    return request("/api/reports/summary", { method: "GET" });
  }
};
