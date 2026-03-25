import React, { useMemo, useState } from "react";
import { Modal } from "./Modal";
import { Badge } from "./Badge";
import { Button } from "./Button";
import { riskBand, formatMoney, formatDate } from "../utils/claims";

// PUBLIC_INTERFACE
export function ClaimDetailModal({
  open,
  claim,
  loading,
  error,
  onClose,
  onSaveOutcome
}) {
  /** Claim detail modal displaying score, risk, signals and outcome updates. */
  const band = riskBand(claim?.fraud_score);
  const riskColor =
    band.key === "high"
      ? "red"
      : band.key === "medium"
        ? "amber"
        : band.key === "low"
          ? "emerald"
          : "slate";

  const [outcome, setOutcome] = useState("review");
  const [notes, setNotes] = useState("");

  const signals = useMemo(() => {
    // backend may provide claim.signals or claim.signal_explanations
    const s = claim?.signals || claim?.signal_explanations || claim?.explanations;
    if (Array.isArray(s)) return s;
    if (s && typeof s === "object") {
      return Object.entries(s).map(([k, v]) => ({
        code: k,
        description: typeof v === "string" ? v : v?.description || v?.reason,
        weight: v?.weight,
        points: v?.points
      }));
    }
    return [];
  }, [claim]);

  return (
    <Modal
      open={open}
      title={
        claim
          ? `Claim ${claim.claim_id || claim.id || ""}`
          : loading
            ? "Loading claim…"
            : "Claim details"
      }
      onClose={onClose}
      footer={
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
            <select
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="h-10 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-300"
              aria-label="Outcome"
            >
              <option value="review">Under review</option>
              <option value="confirmed_fraud">Confirmed fraud</option>
              <option value="false_positive">False positive</option>
              <option value="needs_more_info">Needs more info</option>
              <option value="cleared">Cleared</option>
            </select>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)…"
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-300"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => onSaveOutcome?.({ outcome, notes })}
              disabled={!claim || loading}
            >
              Save outcome
            </Button>
          </div>
        </div>
      }
    >
      {error && (
        <div className="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {String(error)}
        </div>
      )}

      {!claim && !loading && (
        <div className="py-12 text-center text-sm text-slate-500">
          No claim selected.
        </div>
      )}

      {loading && (
        <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
      )}

      {claim && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Fraud score
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {Number.isFinite(Number(claim.fraud_score))
                  ? Math.round(Number(claim.fraud_score))
                  : "—"}
              </div>
              <div className="mt-2">
                <Badge color={riskColor}>{band.label} risk</Badge>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Loss amount
              </div>
              <div className="mt-2 text-2xl font-semibold text-slate-900">
                {formatMoney(claim.loss_amount)}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Created: {formatDate(claim.created_at)}
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200">
              <div className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                Status
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge color="blue">{claim.status || "new"}</Badge>
                {claim.outcome && <Badge color="cyan">{claim.outcome}</Badge>}
              </div>
              <div className="mt-2 text-xs text-slate-600">
                Policy: {claim.policy_id || "—"}
              </div>
            </div>
          </div>

          <div className="rounded-2xl ring-1 ring-slate-200">
            <div className="border-b border-slate-100 px-4 py-3">
              <div className="text-sm font-semibold text-slate-900">
                Signal explanations
              </div>
              <div className="text-xs text-slate-500">
                These signals contributed to the score.
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {signals.map((s, idx) => (
                <div key={idx} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-slate-900">
                        {s.name || s.code || `Signal ${idx + 1}`}
                      </div>
                      <div className="mt-1 text-sm text-slate-600">
                        {s.description || s.reason || "—"}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {s.points != null && (
                        <Badge color="amber">{s.points} pts</Badge>
                      )}
                      {s.weight != null && <Badge color="slate">w={s.weight}</Badge>}
                      {s.severity && <Badge color="slate">{s.severity}</Badge>}
                    </div>
                  </div>
                </div>
              ))}
              {signals.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-slate-500">
                  No signal details provided by backend.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-gray-50 p-4 ring-1 ring-inset ring-slate-200">
            <div className="text-sm font-semibold text-slate-900">
              Investigator notes
            </div>
            <div className="mt-1 text-sm text-slate-600">
              Update the outcome above to keep an audit trail.
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
