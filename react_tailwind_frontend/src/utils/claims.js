/** Map numeric score into risk bands used across UI. */
export function riskBand(score) {
  const s = Number(score);
  if (Number.isNaN(s)) return { key: "unknown", label: "Unknown", color: "slate" };
  if (s >= 80) return { key: "high", label: "High", color: "red" };
  if (s >= 50) return { key: "medium", label: "Medium", color: "amber" };
  return { key: "low", label: "Low", color: "emerald" };
}

export function formatMoney(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
}

export function normalizeClaimsResponse(payload) {
  // Backend may return {data: [...]}, {claims: [...]}, or just [...]
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.claims)) return payload.claims;
  return [];
}

export function normalizeSummaryResponse(payload) {
  return payload && typeof payload === "object" ? payload : {};
}
