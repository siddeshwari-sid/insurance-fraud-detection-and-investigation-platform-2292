import React, { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { ClaimsTable } from "../components/ClaimsTable";
import { ClaimDetailModal } from "../components/ClaimDetailModal";
import { Button } from "../components/Button";
import { api } from "../api/client";
import { normalizeClaimsResponse } from "../utils/claims";

// PUBLIC_INTERFACE
export function ClaimsPage() {
  /** Full claims list view (GET /api/claims). */
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [activeClaim, setActiveClaim] = useState(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeError, setActiveError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.listClaims();
      setClaims(normalizeClaimsResponse(res));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openClaim = async (row) => {
    setModalOpen(true);
    setActiveError("");
    setActiveLoading(true);
    try {
      const id = row?.id || row?.claim_id;
      const detail = await api.getClaim(id);
      setActiveClaim(detail?.claim || detail?.data || detail);
    } catch (e) {
      setActiveError(e?.message || String(e));
      setActiveClaim(row);
    } finally {
      setActiveLoading(false);
    }
  };

  const saveOutcome = async ({ outcome, notes }) => {
    if (!activeClaim) return;
    setActiveLoading(true);
    setActiveError("");
    try {
      const id = activeClaim?.id || activeClaim?.claim_id;
      await api.setOutcome(id, { outcome, notes });
      const detail = await api.getClaim(id);
      setActiveClaim(detail?.claim || detail?.data || detail);
      await load();
    } catch (e) {
      setActiveError(e?.message || String(e));
    } finally {
      setActiveLoading(false);
    }
  };

  return (
    <AppLayout
      title="Claims"
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

      {loading ? (
        <div className="py-12 text-center text-sm text-slate-500">Loading…</div>
      ) : (
        <ClaimsTable claims={claims} onSelect={openClaim} />
      )}

      <ClaimDetailModal
        open={modalOpen}
        claim={activeClaim}
        loading={activeLoading}
        error={activeError}
        onClose={() => setModalOpen(false)}
        onSaveOutcome={saveOutcome}
      />
    </AppLayout>
  );
}
