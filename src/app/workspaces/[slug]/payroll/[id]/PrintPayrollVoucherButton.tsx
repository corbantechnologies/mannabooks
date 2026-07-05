// src/app/workspaces/[slug]/payroll/[id]/PrintPayrollVoucherButton.tsx
"use client";

export function PrintPayrollVoucherButton() {
  function handlePrint() {
    window.print();
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase tracking-wider print:hidden inline-flex items-center gap-1.5"
    >
      <span>🖨️</span>
      <span>Print / Download PDF</span>
    </button>
  );
}
