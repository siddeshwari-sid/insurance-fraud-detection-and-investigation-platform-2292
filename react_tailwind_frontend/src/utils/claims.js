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

function unwrapOkEnvelope(payload) {
  // Backend commonly returns { status: 'ok', data: ... }
  if (payload && typeof payload === "object" && "data" in payload) return payload.data;
  return payload;
}

function mapBackendClaimToUi(row) {
  if (!row || typeof row !== "object") return row;

  // Backend fields:
  // - id (uuid)
  // - claim_number, policy_number, claimant_name
  // - claim_amount
  // - risk_score in [0..1] and risk_band low/medium/high
  // UI expects:
  // - claim_id/policy_id/customer_name/loss_amount
  // - fraud_score in [0..100]
  const riskScore0to1 =
    row.risk_score != null ? Number(row.risk_score) : row.fraud_score != null ? Number(row.fraud_score) / 100 : null;

  const fraudScore =
    riskScore0to1 != null && Number.isFinite(riskScore0to1)
      ? Math.round(riskScore0to1 * 100)
      : row.fraud_score != null
        ? Number(row.fraud_score)
        : null;

  return {
    ...row,

    // Canonical UI fields (non-destructive: only fill if missing)
    claim_id: row.claim_id || row.claim_number || row.id,
    policy_id: row.policy_id || row.policy_number,
    customer_name: row.customer_name || row.claimant_name,
    loss_amount: row.loss_amount ?? row.claim_amount,
    fraud_score: row.fraud_score ?? fraudScore,

    // Keep helpful backend names too
    risk_band: row.risk_band || row.riskBand
  };
}

export function normalizeClaimsResponse(payload) {
  /**
   * Normalizes list/queue responses into an array of UI-friendly claim rows.
   *
   * Supported shapes:
   * - [...rows]
   * - { data: [...rows] }
   * - { status:'ok', data: { items:[...], total, ... } }
   * - { items:[...], total, ... }
   */
  const unwrapped = unwrapOkEnvelope(payload);

  let items = null;
  if (Array.isArray(unwrapped)) items = unwrapped;
  else if (Array.isArray(unwrapped?.items)) items = unwrapped.items;
  else if (Array.isArray(unwrapped?.data)) items = unwrapped.data;
  else if (Array.isArray(unwrapped?.claims)) items = unwrapped.claims;

  return (items || []).map(mapBackendClaimToUi);
}

export function normalizeSummaryResponse(payload) {
  /**
   * Normalizes dashboard summary.
   * Backend shape: {status:'ok', data: {...}} or direct object.
   */
  const unwrapped = unwrapOkEnvelope(payload);
  return unwrapped && typeof unwrapped === "object" ? unwrapped : {};
}

export function normalizeClaimDetailResponse(payload) {
  /**
   * Normalizes claim detail endpoint into a single claim object usable by ClaimDetailModal.
   * Backend shape: { status:'ok', data: { claim, signals, latest_outcome, case } }
   */
  const unwrapped = unwrapOkEnvelope(payload);
  const claim = unwrapped?.claim ? mapBackendClaimToUi(unwrapped.claim) : mapBackendClaimToUi(unwrapped);
  const signals = Array.isArray(unwrapped?.signals) ? unwrapped.signals : claim?.signals || [];

  // Make signals available under the fields the modal already checks.
  return {
    ...claim,
    signals,
    latest_outcome: unwrapped?.latest_outcome || null,
    case: unwrapped?.case || null
  };
}

/** Map UI outcome values to backend enum values. */
export function mapUiOutcomeToBackend(outcome) {
  const o = String(outcome || "").trim();
  // UI values (old): confirmed_fraud, false_positive, review, cleared, needs_more_info
  if (o === "confirmed_fraud") return "fraud_confirmed";
  if (o === "false_positive") return "legit";
  if (o === "cleared") return "no_action";
  if (o === "needs_more_info") return "needs_more_info";
  // Default/fallback
  return "fraud_suspected";
}
