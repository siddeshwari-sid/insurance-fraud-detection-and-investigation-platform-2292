import React, { useState } from "react";
import { AppLayout } from "../components/AppLayout";
import { Button } from "../components/Button";
import { api } from "../api/client";

// PUBLIC_INTERFACE
export function UploadPage() {
  /** CSV upload UI to ingest claims and trigger fraud scoring. */
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const onUpload = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const res = await api.uploadClaimsCsv(file);
      setResult(res);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppLayout title="Upload">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-gray-50 p-4 ring-1 ring-inset ring-slate-200">
            <div className="text-sm font-semibold text-slate-900">
              Upload a CSV of claims
            </div>
            <div className="mt-1 text-sm text-slate-600">
              The backend will ingest rows, compute rule-based fraud signals, and
              assign a fraud score.
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <label className="block">
              <span className="mb-1 block text-sm font-semibold text-slate-800">
                CSV file
              </span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
              />
            </label>

            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={onUpload} disabled={!file || busy}>
                {busy ? "Uploading…" : "Upload & score"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setFile(null);
                  setError("");
                  setResult(null);
                }}
                disabled={busy}
              >
                Reset
              </Button>
              {file && (
                <div className="text-xs text-slate-500">
                  Selected: <span className="font-semibold">{file.name}</span>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            {result && (
              <div className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 ring-1 ring-emerald-200">
                Upload complete.
                <pre className="mt-2 overflow-auto rounded-lg bg-white/60 p-2 text-xs text-slate-700">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <div className="text-sm font-semibold text-slate-900">
            CSV expectations
          </div>
          <div className="mt-2 text-sm text-slate-600">
            Your CSV should include common claim fields like:
          </div>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>claim_id</li>
            <li>policy_id</li>
            <li>customer_name / customer_id</li>
            <li>loss_amount</li>
            <li>date_of_loss or similar</li>
          </ul>
          <div className="mt-3 text-xs text-slate-500">
            Backend may accept additional columns and derive signals accordingly.
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
