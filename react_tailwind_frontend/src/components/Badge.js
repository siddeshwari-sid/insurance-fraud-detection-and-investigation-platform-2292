import React from "react";

/** Color map aligned to the light theme + risk bands. */
const COLOR = {
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
  red: "bg-red-50 text-red-700 ring-red-200",
  amber: "bg-amber-50 text-amber-800 ring-amber-200",
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-200",
  cyan: "bg-cyan-50 text-cyan-700 ring-cyan-200"
};

// PUBLIC_INTERFACE
export function Badge({ color = "slate", children }) {
  /** Small pill badge. */
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        COLOR[color] || COLOR.slate
      ].join(" ")}
    >
      {children}
    </span>
  );
}
