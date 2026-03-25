import React, { useEffect, useMemo, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { RetryState } from "../components/RetryState";
import { api } from "../api/client";
import { normalizeSummaryResponse } from "../utils/claims";

function StatCard({ label, value, hint, color = "slate" }) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
      <div className="flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </div>
        <Badge color={color}>{hint}</Badge>
      </div>
      <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
export function DashboardPage() {
  /** Dashboard overview with summary reporting. */
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [error, setError] = useState("");

  const [rawError, setRawError] = useState(null);

  const load = async () => {
    setLoading(true);
    setError("");
    setRawError(null);
    try {
      const res = await api.getSummary();
      // null => empty/blank response. Normalize to {} so UI can show empty state.
      setSummary(normalizeSummaryResponse(res || {}));
    } catch (e) {
      setRawError(e);
      setError(e?.message || String(e));
      setSummary({});
    } finally {
      setLoading(false);
    }
  };

  const isEmpty = useMemo(() => {
    const s = summary || {};
    const totalVal = s.total_claims ?? s.total;
    // Consider empty when no totals are present or total == 0
    if (totalVal == null) return true;
    const n = Number(totalVal);
    return Number.isFinite(n) ? n === 0 : false;
  }, [summary]);

  useEffect(() => {
    load();
  }, []);

  const total = summary.total_claims ?? summary.total ?? "—";
  const high = summary.high_risk ?? summary.high ?? summary.highRisk ?? "—";
  const medium =
    summary.medium_risk ?? summary.medium ?? summary.mediumRisk ?? "—";
  const low = summary.low_risk ?? summary.low ?? summary.lowRisk ?? "—";

  return (
    <AppLayout
      title="Dashboard"
      right={
        <Button variant="secondary" onClick={load} disabled={loading}>
          Refresh
        </Button>
      }
    >
      <div className="mb-4">
        <RetryState
          error={rawError}
          onRetry={load}
          title="Dashboard summary unavailable"
          description="We couldn’t load the dashboard summary from the backend."
        />
        {!rawError && !loading && (
          <RetryState
            empty={isEmpty}
            onRetry={load}
            emptyTitle="No claims ingested yet"
            emptyDescription="Upload a CSV to ingest claims and generate fraud scores, then refresh this dashboard."
          />
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total claims" value={total} hint="All" color="slate" />
        <StatCard label="High risk" value={high} hint="≥ 80" color="red" />
        <StatCard label="Medium risk" value={medium} hint="50–79" color="amber" />
        <StatCard label="Low risk" value={low} hint="< 50" color="emerald" />
      </div>

      <div className="mt-5 rounded-2xl bg-gradient-to-br from-blue-500/10 to-gray-50 p-4 ring-1 ring-inset ring-slate-200">
        <div className="text-sm font-semibold text-slate-900">
          What to do next
        </div>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
          <li>
            Open <span className="font-semibold">Queue</span> to triage high risk
            claims and update outcomes.
          </li>
          <li>
            Use <span className="font-semibold">Upload</span> to ingest a new CSV
            and generate fresh scoring signals.
          </li>
        </ul>
        {loading && (
          <div className="mt-2 text-xs text-slate-500">Loading summary…</div>
        )}
      </div>
    </AppLayout>
  );
}
