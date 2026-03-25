/**
 * Lightweight API client for the Express backend.
 *
 * Env:
 * - REACT_APP_API_BASE_URL: Base URL for backend, e.g. https://...:3001
 *   (This is the canonical env var for this app.)
 *
 * Back-compat env vars (deprecated):
 * - REACT_APP_API_BASE
 * - REACT_APP_BACKEND_URL
 * - REACT_APP_API_URL
 */

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  process.env.REACT_APP_API_BASE ||
  process.env.REACT_APP_BACKEND_URL ||
  process.env.REACT_APP_API_URL ||
  "http://localhost:3001";

/**
 * Best-effort check for HTML error bodies (common for proxy/CDN error pages).
 * This helps surface clear errors even when the backend is expected to return JSON.
 */
function looksLikeHtml(text) {
  const t = String(text || "").trim().toLowerCase();
  return t.startsWith("<!doctype html") || t.startsWith("<html") || t.includes("<head");
}

// PUBLIC_INTERFACE
export class RequestError extends Error {
  /** Error thrown by the API client with structured metadata. */
  constructor(message, { status, url, body, contentType, isHtml, isNetworkError } = {}) {
    super(message);
    this.name = "RequestError";
    this.status = status;
    this.url = url;
    this.body = body;
    this.contentType = contentType;
    this.isHtml = Boolean(isHtml);
    this.isNetworkError = Boolean(isNetworkError);
  }
}

async function safeReadText(res) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

async function parseResponseBody(res) {
  const contentType = res.headers.get("content-type") || "";

  // 204: explicitly empty
  if (res.status === 204) return { data: null, contentType, rawText: "" };

  // Some servers return 200 with empty body (or content-length: 0).
  // Avoid throwing on res.json() in those cases.
  const rawText = await safeReadText(res);
  const trimmed = rawText.trim();

  if (!trimmed) return { data: null, contentType, rawText };

  // Prefer JSON when indicated, but still guard parsing.
  if (contentType.includes("application/json")) {
    try {
      return { data: JSON.parse(trimmed), contentType, rawText };
    } catch {
      // Fallthrough: treat as text so we can still surface something useful
      return { data: trimmed, contentType, rawText };
    }
  }

  // Otherwise treat as text; caller will detect HTML etc.
  return { data: trimmed, contentType, rawText };
}

function extractErrorMessage(parsedBody) {
  if (parsedBody == null) return "Request failed";
  if (typeof parsedBody === "string") return parsedBody;

  // Common error shapes:
  // - { error: "..." }
  // - { message: "..." }
  // - { status:"error", message:"...", details:"..." }
  // - { statusCode, error, message }
  return (
    parsedBody.error ||
    parsedBody.message ||
    parsedBody.details ||
    parsedBody.reason ||
    "Request failed"
  );
}

/**
 * Whether the request is worth retrying.
 * Retry on:
 * - network errors (fetch throws)
 * - 408, 429, 500, 502, 503, 504
 */
function shouldRetry(err) {
  if (!(err instanceof RequestError)) return false;
  if (err.isNetworkError) return true;
  return [408, 429, 500, 502, 503, 504].includes(Number(err.status));
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function doFetch(url, options) {
  try {
    return await fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {})
      }
    });
  } catch (e) {
    // Network failure: DNS, CORS, offline, TLS, etc.
    throw new RequestError(e?.message || "Network error", {
      status: 0,
      url,
      isNetworkError: true
    });
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await doFetch(url, options);

  const { data, contentType, rawText } = await parseResponseBody(res);

  if (!res.ok) {
    const msg = extractErrorMessage(data);
    const isHtml = typeof data === "string" && looksLikeHtml(data);

    // Make HTML error pages more obvious.
    const decoratedMessage = isHtml
      ? `Backend returned HTML (likely proxy/server error page). HTTP ${res.status}.`
      : msg;

    throw new RequestError(decoratedMessage, {
      status: res.status,
      url,
      body: data,
      contentType,
      isHtml
    });
  }

  // Successful but empty: normalize to null so pages can show empty-state.
  return data == null ? null : data;
}

/**
 * Request helper with retries and small backoff.
 * The UI can show "Retry" for a better experience, but we also do a couple
 * automatic retries for transient 5xx.
 */
async function requestWithRetry(path, options = {}) {
  const retries = Number.isFinite(options.retries) ? options.retries : 2;
  const retryDelayMs = Number.isFinite(options.retryDelayMs) ? options.retryDelayMs : 500;
  const retryJitterMs = Number.isFinite(options.retryJitterMs) ? options.retryJitterMs : 200;

  // Do not forward these custom options to fetch.
  const { retries: _r, retryDelayMs: _d, retryJitterMs: _j, ...fetchOptions } = options;

  let lastErr = null;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await request(path, fetchOptions);
    } catch (e) {
      lastErr = e;
      const canRetry = shouldRetry(e) && attempt < retries;
      if (!canRetry) throw e;

      const jitter = Math.floor(Math.random() * retryJitterMs);
      await sleep(retryDelayMs * (attempt + 1) + jitter);
    }
  }
  // Should never reach here, but just in case:
  throw lastErr || new RequestError("Request failed", { status: 0, url: `${API_BASE}${path}` });
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
    return requestWithRetry("/api/claims/upload", {
      method: "POST",
      body: form,
      // Upload retries: keep low; if server fails mid-upload, user can retry manually.
      retries: 1
    });
  },

  /** PUBLIC_INTERFACE
   * List claims with optional query params.
   * Frontend uses { q, risk } but backend expects { claim_number, risk_band }.
   * @param {{q?:string, risk?:string, status?:string, limit?:number, offset?:number, risk_band?:string, claim_number?:string}} params
   */
  async listClaims(params) {
    const mapped = {
      ...params,
      // map legacy UI query keys -> backend-supported keys
      claim_number: params?.claim_number ?? params?.q,
      risk_band: params?.risk_band ?? params?.risk
    };
    // Avoid sending UI-only keys that backend doesn't recognize.
    delete mapped.q;
    delete mapped.risk;

    return requestWithRetry(`/api/claims${toQuery(mapped)}`, { method: "GET" });
  },

  /** PUBLIC_INTERFACE
   * Fetch claim details by id.
   * @param {string} id
   */
  async getClaim(id) {
    return requestWithRetry(`/api/claims/${encodeURIComponent(id)}`, { method: "GET" });
  },

  /** PUBLIC_INTERFACE
   * Update claim outcome.
   * @param {string} id
   * @param {{outcome:string, notes?:string}} payload
   */
  async setOutcome(id, payload) {
    return requestWithRetry(`/api/claims/${encodeURIComponent(id)}/outcome`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      retries: 1
    });
  },

  /** PUBLIC_INTERFACE
   * Queue endpoint for investigator triage.
   * Backend supports limit/offset. (Filtering can be added server-side later.)
   * @param {{limit?:number, offset?:number}} params
   */
  async getQueue(params) {
    const { limit, offset } = params || {};
    return requestWithRetry(`/api/queue${toQuery({ limit, offset })}`, { method: "GET" });
  },

  /** PUBLIC_INTERFACE
   * Summary reporting for dashboard.
   */
  async getSummary() {
    return requestWithRetry("/api/reports/summary", { method: "GET" });
  }
};
