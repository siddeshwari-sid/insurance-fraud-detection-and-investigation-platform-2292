import React from "react";

const VARIANTS = {
  primary:
    "bg-brand-primary text-white hover:bg-blue-600 focus-visible:ring-blue-500/40",
  secondary:
    "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50",
  danger: "bg-red-600 text-white hover:bg-red-700",
  ghost: "bg-transparent text-slate-700 hover:bg-slate-100"
};

// PUBLIC_INTERFACE
export function Button({
  variant = "primary",
  size = "md",
  className = "",
  ...props
}) {
  /** Consistent button styling across app. */
  const sizes =
    size === "sm"
      ? "h-9 px-3 text-sm"
      : size === "lg"
        ? "h-11 px-4 text-sm"
        : "h-10 px-4 text-sm";

  return (
    <button
      {...props}
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        sizes,
        VARIANTS[variant] || VARIANTS.primary,
        className
      ].join(" ")}
    />
  );
}
