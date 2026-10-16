"use client";
// src/components/ui/index.tsx
// Shared UI kit (MODULE_AUDIT_PLAN.md Stage 10). Mobile-first: everything works at 360px width,
// touch targets are at least 44px, and text uses the sans face (mono only for figures and codes).

import { ReactNode, useEffect, useId, useRef } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ PageHeader */
export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="text-xs font-medium text-zinc-500">{eyebrow}</p>}
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-600 max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 sm:justify-end">{actions}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ Button */
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: "bg-zinc-900 text-white hover:bg-zinc-800 disabled:bg-zinc-400",
  secondary: "bg-white text-zinc-900 border border-zinc-300 hover:bg-zinc-50 disabled:text-zinc-400",
  ghost: "text-zinc-700 hover:bg-zinc-100",
  danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300",
};

export function Button({
  variant = "primary",
  className,
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2 disabled:cursor-not-allowed",
        BUTTON_STYLES[variant],
        className
      )}
      {...props}
    />
  );
}

/* ------------------------------------------------------------------ StatCard */
export function StatCard({ label, value, hint, tone = "default" }: { label: string; value: ReactNode; hint?: string; tone?: "default" | "positive" | "negative" }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4">
      <p className="text-xs font-medium text-zinc-500">{label}</p>
      <p
        className={cn(
          "mt-1 text-xl font-semibold tabular-nums",
          tone === "positive" && "text-emerald-700",
          tone === "negative" && "text-rose-700",
          tone === "default" && "text-zinc-900"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Badge */
export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "success" | "warning" | "danger" }) {
  const tones = {
    neutral: "bg-zinc-100 text-zinc-700",
    success: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-rose-50 text-rose-700",
  };
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium", tones[tone])}>{children}</span>;
}

/* ------------------------------------------------------------------ EmptyState */
export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      {description && <p className="max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ Skeleton */
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-zinc-100" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <div className="h-4 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 flex-1 animate-pulse rounded bg-zinc-100" />
          <div className="h-4 w-20 animate-pulse rounded bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ DataTable */
export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: "left" | "right";
  /** Shown as the card title on small screens. */
  primary?: boolean;
  /** Hidden on small screens. */
  desktopOnly?: boolean;
}

/** Table on md+ screens, stacked cards on phones. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  actions,
  footer,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  actions?: (row: T) => ReactNode;
  footer?: ReactNode;
}) {
  const primary = columns.find((c) => c.primary) || columns[0];
  const rest = columns.filter((c) => c !== primary && !c.desktopOnly);
  return (
    <div>
      <table className="hidden w-full text-sm md:table">
        <thead>
          <tr className="border-b border-zinc-200 text-left text-xs font-medium text-zinc-500">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn("px-4 py-3 font-medium", c.align === "right" && "text-right")}>
                {c.header}
              </th>
            ))}
            {actions && <th className="px-4 py-3" aria-label="Actions" />}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="hover:bg-zinc-50/70">
              {columns.map((c) => (
                <td key={c.key} className={cn("px-4 py-3 align-top text-zinc-800", c.align === "right" && "text-right tabular-nums")}>
                  {c.render(row)}
                </td>
              ))}
              {actions && <td className="px-4 py-2 text-right whitespace-nowrap">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>

      <ul className="divide-y divide-zinc-100 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 text-sm font-medium text-zinc-900">{primary.render(row)}</div>
              {actions && <div className="flex shrink-0 gap-1">{actions(row)}</div>}
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              {rest.map((c) => (
                <div key={c.key} className={cn("min-w-0", c.align === "right" && "text-right")}>
                  <dt className="text-zinc-500">{c.header}</dt>
                  <dd className={cn("truncate text-zinc-800", c.align === "right" && "tabular-nums font-medium")}>{c.render(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
      {footer}
    </div>
  );
}

/* ------------------------------------------------------------------ FormField */
export function FormField({
  label,
  error,
  hint,
  required,
  children,
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-zinc-800">
        {label}
        {required && <span className="text-rose-600"> *</span>}
      </label>
      {children}
      {error ? <p className="text-xs text-rose-600">{error}</p> : hint ? <p className="text-xs text-zinc-500">{hint}</p> : null}
    </div>
  );
}

export const inputClass =
  "block w-full min-h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 " +
  "focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-900/10 disabled:bg-zinc-50";

/* ------------------------------------------------------------------ Sheet */
/** Bottom sheet on phones, right-hand panel on larger screens. Closes on Esc and backdrop click. */
export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "absolute flex flex-col bg-white shadow-xl",
          "inset-x-0 bottom-0 max-h-[92vh] rounded-t-2xl",
          "sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-full sm:max-w-md sm:rounded-none"
        )}
      >
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <h2 id={titleId} className="text-base font-semibold text-zinc-900">{title}</h2>
          <button type="button" onClick={onClose} className="min-h-11 min-w-11 rounded-lg text-zinc-500 hover:bg-zinc-100" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="border-t border-zinc-200 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  );
}
