// src/components/PageShell.tsx
// Shared layout shell for all inner workspace pages.
// Replaces the repetitive "p-4 sm:p-8 space-y-N border-b" pattern
// with a consistent, modern canvas.

interface PageShellProps {
  /** Page title — rendered as the prominent <h1> */
  title: string;
  /** Optional eyebrow line above the title */
  eyebrow?: string;
  /** Optional action buttons / controls to slot into the header right side */
  actions?: React.ReactNode;
  /** Optional content to render below the header, above the main slot */
  subheader?: React.ReactNode;
  /** Main page content */
  children: React.ReactNode;
  /** Extra class on the outer wrapper — e.g. "max-w-6xl mx-auto" */
  className?: string;
}

export function PageShell({
  title,
  eyebrow,
  actions,
  subheader,
  children,
  className = "",
}: PageShellProps) {
  return (
    <div className={`p-5 sm:p-7 space-y-6 ${className}`}>
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {eyebrow && (
            <p className="text-xs text-zinc-400 font-medium mb-0.5">{eyebrow}</p>
          )}
          <h1 className="text-[22px] font-semibold text-zinc-900 leading-tight">{title}</h1>
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>

      {/* Optional sub-header zone (filter bars, stat strips, tabs) */}
      {subheader && <div className="space-y-4">{subheader}</div>}

      {/* Main content */}
      <div className="space-y-4">{children}</div>
    </div>
  );
}
