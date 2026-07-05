// src/app/workspaces/[slug]/payroll/[id]/PrintPayrollVoucherButton.tsx
"use client";

interface DownloadPayrollPdfButtonProps {
  voucherId: string;
}

export function PrintPayrollVoucherButton({ voucherId }: DownloadPayrollPdfButtonProps) {
  return (
    <a
      href={`/portal/pdf/${voucherId}`}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
    >
      <span>📥</span>
      <span>Download Official PDF</span>
    </a>
  );
}
