import React, { useMemo, useState } from "react";
import { Button } from "./Button";

/**
 * Attempt to extract a compact, human friendly error string.
 * Includes special handling for HTML error pages.
 */
function formatError(err) {
  if (!err) return "";
  const msg = err?.message || String(err);

  // If this is our RequestError, try to enrich details.
  const isHtml = Boolean(err?.isHtml);
  const status = err?.status;

  if (isHtml) {
    return status
      ? `Backend returned HTML instead of JSON (HTTP ${status}). This usually indicates a proxy/server error page.`
      : "Backend returned HTML instead of JSON. This usually indicates a proxy/server error page.";
  }

  if (status) return `${msg} (HTTP ${status})`;
  return msg;
}

// PUBLIC_INTERFACE
export function RetryState({
  title,
  description,
  error,
  onRetry,
  retryLabel = "Retry",
  showDetails = true,
  empty = false,
  emptyTitle = "No data yet",
  emptyDescription = "Try uploading a CSV to generate scores, then refresh."
}) {
  /** Generic empty/error state with retry UX. */
  const [detailsOpen, setDetailsOpen] = useState(false);

  const hasError = Boolean(error);
  const headline = useMemo(() => {
    if (hasError) return title || "We couldn’t load this data";
    if (empty) return emptyTitle;
    return title || "";
  }, [hasError, title, empty, emptyTitle]);

  const bodyText = useMemo(() => {
    if (hasError) return description || "Please try again. If the problem persists, check backend logs/config.";
    if (empty) return emptyDescription;
    return description || "";
  }, [hasError, description, empty, emptyDescription]);

  const errorText = useMemo(() => formatError(error), [error]);
  const technical = useMemo(() => {
    if (!error) return null;
    return {
      name: error?.name,
      message: error?.message,
      status: error?.status,
      url: error?.url,
      contentType: error?.contentType,
      isHtml: error?.isHtml,
      body: error?.body
    };
  }, [error]);

  if (!hasError && !empty) return null;

  return (
    <div
      className={[
        "rounded-2xl p-4 ring-1",
        hasError ? "bg-red-50 text-red-800 ring-red-200" : "bg-slate-50 text-slate-800 ring-slate-200"
      ].join(" ")}
      role={hasError ? "alert" : "status"}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-semibold">{headline}</div>
          <div className="mt-1 text-sm opacity-90">{bodyText}</div>

          {hasError && errorText && (
            <div className="mt-2 text-sm font-medium">{errorText}</div>
          )}
        </div>

        {onRetry && (
          <div className="flex shrink-0 items-center gap-2">
            <Button variant={hasError ? "danger" : "secondary"} onClick={onRetry}>
              {retryLabel}
            </Button>
            {hasError && showDetails && (
              <Button variant="secondary" onClick={() => setDetailsOpen((v) => !v)}>
                {detailsOpen ? "Hide details" : "Details"}
              </Button>
            )}
          </div>
        )}
      </div>

      {hasError && showDetails && detailsOpen && (
        <pre className="mt-3 overflow-auto rounded-xl bg-white/60 p-3 text-xs text-slate-800 ring-1 ring-slate-200">
          {JSON.stringify(technical, null, 2)}
        </pre>
      )}
    </div>
  );
}
