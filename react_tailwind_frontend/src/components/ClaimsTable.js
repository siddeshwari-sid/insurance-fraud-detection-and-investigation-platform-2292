import React, { useMemo, useState } from "react";
import { Badge } from "./Badge";
import { riskBand, formatMoney, formatDate } from "../utils/claims";

function SortHeader({ label, field, sort, setSort }) {
  const active = sort.field === field;
  const dir = active ? sort.dir : null;

  return (
    <button
      className="inline-flex items-center gap-2 text-left text-xs font-semibold uppercase tracking-wide text-slate-600 hover:text-slate-900"
      onClick={() => {
        setSort((prev) => {
          if (prev.field !== field) return { field, dir: "desc" };
          return { field, dir: prev.dir === "desc" ? "asc" : "desc" };
        });
      }}
    >
      {label}
      {active && (
        <span className="text-[10px] font-bold text-slate-500">
          {dir === "desc" ? "↓" : "↑"}
        </span>
      )}
    </button>
  );
}

// PUBLIC_INTERFACE
export function ClaimsTable({ claims, onSelect }) {
  /** Table for claims list/queue; supports local filter + sort. */
  const [q, setQ] = useState("");
  const [risk, setRisk] = useState("all");
  const [sort, setSort] = useState({ field: "fraud_score", dir: "desc" });

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (claims || []).filter((c) => {
      const band = riskBand(c.fraud_score, c.risk_band);
      const matchRisk = risk === "all" ? true : band.key === risk;
      const haystack = [
        c.id,
        c.claim_id,
        c.policy_id,
        c.customer_name,
        c.customer_id,
        c.status,
        c.outcome
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const matchQuery = query ? haystack.includes(query) : true;
      return matchRisk && matchQuery;
    });
  }, [claims, q, risk]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    const dirMult = sort.dir === "desc" ? -1 : 1;
    list.sort((a, b) => {
      const av = a?.[sort.field];
      const bv = b?.[sort.field];
      const an = Number(av);
      const bn = Number(bv);

      if (!Number.isNaN(an) && !Number.isNaN(bn)) return (an - bn) * dirMult;
      return String(av ?? "").localeCompare(String(bv ?? "")) * dirMult;
    });
    return list;
  }, [filtered, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by claim/policy/customer/status…"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm focus:border-blue-300"
          />
          <select
            value={risk}
            onChange={(e) => setRisk(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 shadow-sm focus:border-blue-300 sm:w-44"
            aria-label="Risk filter"
          >
            <option value="all">All risk</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{sorted.length}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl ring-1 ring-slate-200">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left">
                <SortHeader
                  label="Claim"
                  field="claim_id"
                  sort={sort}
                  setSort={setSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader
                  label="Policy"
                  field="policy_id"
                  sort={sort}
                  setSort={setSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader
                  label="Customer"
                  field="customer_name"
                  sort={sort}
                  setSort={setSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader
                  label="Loss"
                  field="loss_amount"
                  sort={sort}
                  setSort={setSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader
                  label="Score"
                  field="fraud_score"
                  sort={sort}
                  setSort={setSort}
                />
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Risk
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Status
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <SortHeader
                  label="Created"
                  field="created_at"
                  sort={sort}
                  setSort={setSort}
                />
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {sorted.map((c) => {
              const band = riskBand(c.fraud_score, c.risk_band);
              const riskColor =
                band.key === "high"
                  ? "red"
                  : band.key === "medium"
                    ? "amber"
                    : band.key === "low"
                      ? "emerald"
                      : "slate";

              return (
                <tr
                  key={c.id || c.claim_id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => onSelect?.(c)}
                  role="row"
                >
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                    {c.claim_id || c.id || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {c.policy_id || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {c.customer_name || c.customer_id || "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {formatMoney(c.loss_amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-semibold text-slate-900">
                    {Number.isFinite(Number(c.fraud_score))
                      ? Math.round(Number(c.fraud_score))
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    <Badge color={riskColor}>{band.label}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    <Badge color="blue">{c.status || "new"}</Badge>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                    {formatDate(c.created_at)}
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-sm text-slate-500"
                >
                  No claims match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-slate-500">
        Click a row to open claim details and update outcomes.
      </div>
    </div>
  );
}
