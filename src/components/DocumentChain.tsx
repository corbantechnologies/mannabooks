"use client";

import Link from "next/link";

export type ChainDocType =
  | "QUOTATION" | "INVOICE" | "RECEIPT" | "CREDIT_NOTE" | "DEBIT_NOTE"
  | "LPO" | "PO" | "DELIVERY_NOTE" | "GOODS_RECEIVED_NOTE"
  | "PAYMENT_VOUCHER" | "PAYROLL_VOUCHER";

export interface ChainNode {
  id: string;
  docNumber: string;
  type: string;
  status: string;
  issueDate: string | Date;
}

interface DocumentChainProps {
  chain: ChainNode[];
  currentDocId: string;
  shopSlug?: string; // Omit on public portal
  brandColor?: string;
}

const TYPE_ICON: Record<string, string> = {
  QUOTATION: "📋",
  INVOICE: "📄",
  RECEIPT: "🧾",
  CREDIT_NOTE: "↩️",
  DEBIT_NOTE: "↪️",
  LPO: "📦",
  PO: "📦",
  DELIVERY_NOTE: "🚚",
  GOODS_RECEIVED_NOTE: "✅",
  PAYMENT_VOUCHER: "💳",
  PAYROLL_VOUCHER: "👥",
};

function statusColor(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case "PAID":
    case "RECEIVED":
      return { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-300" };
    case "ISSUED":
      return { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-300" };
    case "OVERDUE":
      return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300" };
    case "CANCELLED":
      return { bg: "bg-zinc-100", text: "text-zinc-400", border: "border-zinc-200" };
    case "DRAFT":
      return { bg: "bg-zinc-50", text: "text-zinc-500", border: "border-zinc-200" };
    default:
      return { bg: "bg-zinc-50", text: "text-zinc-600", border: "border-zinc-200" };
  }
}

export function DocumentChain({ chain, currentDocId, shopSlug, brandColor }: DocumentChainProps) {
  if (!chain || chain.length <= 1) return null;

  return (
    <div className="mb-6">
      <p className="font-mono text-[10px] text-zinc-400 uppercase font-bold mb-3 tracking-widest">
        Document Journey — {chain.length} Step{chain.length > 1 ? "s" : ""}
      </p>

      {/* Horizontal scrollable chain */}
      <div className="overflow-x-auto -mx-1 px-1 pb-2">
        <div className="flex items-start gap-0 min-w-max">
          {chain.map((node, idx) => {
            const isCurrent = node.id === currentDocId;
            const { bg, text, border } = statusColor(node.status);
            const icon = TYPE_ICON[node.type] || "📄";
            const href = shopSlug
              ? `/workspaces/${shopSlug}/documents/${node.id}`
              : null;

            const cardEl = (
              <div
                className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-xl border-2 transition-all min-w-[100px] max-w-[130px] text-center
                  ${isCurrent
                    ? "border-black bg-black text-white shadow-md scale-[1.05]"
                    : `${border} ${bg} hover:border-zinc-400 cursor-pointer hover:scale-[1.02] transition-transform`
                  }`}
              >
                <span className="text-xl leading-none">{icon}</span>
                <span className={`font-mono text-[9px] font-bold uppercase tracking-widest ${isCurrent ? "text-zinc-300" : "text-zinc-400"}`}>
                  {node.type.replace(/_/g, " ")}
                </span>
                <span className={`font-mono text-[11px] font-black leading-tight ${isCurrent ? "text-white" : "text-black"}`}>
                  {node.docNumber}
                </span>
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border font-mono
                  ${isCurrent
                    ? "bg-white/10 text-white border-white/20"
                    : `${bg} ${text} ${border}`
                  }`}>
                  {node.status}
                </span>
                <span className={`text-[9px] font-sans mt-0.5 ${isCurrent ? "text-zinc-400" : "text-zinc-400"}`}>
                  {new Date(node.issueDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
                </span>
              </div>
            );

            return (
              <div key={node.id} className="flex items-center">
                {/* The card — linked if shopSlug provided and not current doc */}
                {href && !isCurrent ? (
                  <Link href={href} className="no-underline">
                    {cardEl}
                  </Link>
                ) : (
                  cardEl
                )}

                {/* Arrow connector between nodes */}
                {idx < chain.length - 1 && (
                  <div className="flex items-center px-1.5 shrink-0">
                    <div className="flex items-center gap-0.5 text-zinc-300">
                      <div className="h-0.5 w-4 bg-zinc-300 rounded-full" />
                      <span className="text-zinc-400 text-xs font-bold">→</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
