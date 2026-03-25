import React, { useEffect, useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { ClaimsTable } from "../components/ClaimsTable";
import { ClaimDetailModal } from "../components/ClaimDetailModal";
import { Button } from "../components/Button";
import { RetryState } from "../components/RetryState";
import { api } from "../api/client";
import {
  normalizeClaimsResponse,
  normalizeClaimDetailResponse,
  mapUiOutcomeToBackend
} from "../utils/claims";

// PUBLIC_INTERFACE
export function ClaimsPage() {
  /** Full claims list view (GET /api/claims). */
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
  const [error, setError] = useState("");
  const [rawError, setRawError] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [activeClaim, setActiveClaim] = useState(null);
  const [activeLoading, setActiveLoading] = useState(false);
  const [activeError, setActiveError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    setRawError(null);
    try {
      const res = await api.listClaims();
      setClaims(normalizeClaimsResponse(res || []));
    } catch (e) {
      setRawError(e);
      setError(e?.message || String(e));
      setClaims([]);
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
      const id = row?.id || row?.claim_id || row?.claim_number;
      const detail = await api.getClaim(id);
      setActiveClaim(normalizeClaimDetailResponse(detail));
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
      const id = activeClaim?.id || activeClaim?.claim_id || activeClaim?.claim_number;
      await api.setOutcome(id, { outcome: mapUiOutcomeToBackend(outcome), notes });
      const detail = await api.getClaim(id);
      setActiveClaim(normalizeClaimDetailResponse(detail));
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
      <div className="mb-4">
        <RetryState
          error={rawError}
          onRetry={load}
          title="Claims list unavailable"
          description="We couldn’t load claims from the backend."
        />
        {!rawError && !loading && claims.length === 0 && (
          <RetryState
            empty
            onRetry={load}
            emptyTitle="No claims found"
            emptyDescription="Upload a CSV to ingest claims and generate scores, then refresh."
          />
        )}
      </div>

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
