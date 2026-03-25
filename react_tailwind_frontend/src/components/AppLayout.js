import React from "react";
import { NavLink } from "react-router-dom";

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition",
          isActive
            ? "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200"
            : "text-slate-700 hover:bg-slate-100"
        ].join(" ")
      }
    >
      <span className="h-2.5 w-2.5 rounded-full bg-brand-accent" />
      {label}
    </NavLink>
  );
}

// PUBLIC_INTERFACE
export function AppLayout({ title, children, right }) {
  /** Global layout with sidebar and top header. */
  return (
    <div className="min-h-screen bg-[#f9fafb]">
      <div className="mx-auto flex max-w-7xl gap-6 p-4 sm:p-6">
        <aside className="hidden w-64 shrink-0 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:block">
          <div className="mb-4">
            <div className="text-sm font-semibold text-slate-900">
              Fraud Signals
            </div>
            <div className="text-xs text-slate-500">
              Investigation workspace
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            <NavItem to="/" label="Dashboard" />
            <NavItem to="/queue" label="Queue" />
            <NavItem to="/upload" label="Upload" />
          </nav>

          <div className="mt-6 rounded-xl bg-gradient-to-br from-blue-500/10 to-gray-50 p-3 ring-1 ring-inset ring-slate-200">
            <div className="text-xs font-semibold text-slate-800">
              Tip: review high risk first
            </div>
            <div className="mt-1 text-xs text-slate-600">
              Use filters and outcomes to track your decisions.
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="mb-4 flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h1 className="truncate text-lg font-semibold text-slate-900">
                {title}
              </h1>
              <p className="mt-0.5 text-sm text-slate-500">
                Claims triage, scoring signals, and outcome tracking
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">{right}</div>
          </header>

          <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5">
            {children}
          </div>

          <div className="mt-4 text-xs text-slate-500">
            Backend:{" "}
            <span className="font-medium text-slate-700">
              {process.env.REACT_APP_API_BASE ||
                process.env.REACT_APP_BACKEND_URL ||
                process.env.REACT_APP_API_URL ||
                "not set"}
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
