import React, { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
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

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.getSummary();
      setSummary(normalizeSummaryResponse(res));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

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
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
          {error}
        </div>
      )}

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
