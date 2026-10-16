"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { SupplierActionsPopover } from "./SupplierActionsPopover";
import { useSupplier } from "@/hooks/useSuppliers";
import { useSupplierDocuments } from "@/hooks/useDocuments";
import { useClients } from "@/hooks/useClients";
import { Spinner } from "@/components/Spinner";
import { DocumentsTableClient, type StreamDocument } from "../../documents/DocumentsTableClient";

const SUPPLIER_DOC_TABS = [
  { key: "ALL", label: "All Records" },
  { key: "LPO", label: "Local Purchase Orders" },
  { key: "PO", label: "Purchase Orders" },
  { key: "INVOICE", label: "Vendor Invoices" },
  { key: "RECEIPT", label: "Payment Receipts" },
  { key: "GOODS_RECEIVED_NOTE", label: "GRN" },
  { key: "PAYMENT_VOUCHER", label: "Vouchers" },
];

interface SupplierDetailClientProps {
  shop: any;
  shopSlug: string;
  supplierId: string;
}

export function SupplierDetailClient({ shop, shopSlug, supplierId }: SupplierDetailClientProps) {
  const { data: supplierRecord, isLoading: isLoadingSupplier, error: supplierError } = useSupplier(
    shop.id,
    supplierId
  );
  const { data: supplierDocuments = [], isLoading: isLoadingDocs } = useSupplierDocuments(
    shop.id,
    supplierId
  );

  const taxPin = supplierRecord?.tax_pin || supplierRecord?.taxPin;
  const { data: matchedClients = [] } = useClients(shop.id, taxPin || undefined);
  const matchedClient = taxPin
    ? matchedClients.find((c: any) => (c.tax_pin || c.taxPin) === taxPin) || null
    : null;

  if (isLoadingSupplier || isLoadingDocs) {
    return (
      <div className="p-12 flex flex-col items-center justify-center space-y-3">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading supplier details...</p>
      </div>
    );

  }

  if (supplierError || !supplierRecord) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-rose-600 font-semibold">Supplier record could not be loaded.</p>
        <Link
          href={`/workspaces/${shopSlug}/suppliers`}
          className="btn-secondary-modern px-4 py-2 text-xs uppercase"
        >
          ← Back to Supplier Registry
        </Link>
      </div>
    );
  }

  // Calculate gross procurement turnover
  const totalProcurementSpend = (Array.isArray(supplierDocuments) ? supplierDocuments : [])
    .filter((d: any) => d.status === "PAID")
    .reduce((acc: number, curr: any) => acc + Number(curr.grand_total || curr.grandTotal || 0), 0);

  // Calculate accounts payable debt
  const accountsPayableDebt = (Array.isArray(supplierDocuments) ? supplierDocuments : [])
    .filter((d: any) => d.status === "ISSUED" || d.status === "OVERDUE")
    .reduce((acc: number, curr: any) => acc + Number(curr.grand_total || curr.grandTotal || 0), 0);

  const streamDocs: StreamDocument[] = (Array.isArray(supplierDocuments) ? supplierDocuments : []).map((doc: any) => ({
    id: doc.id,
    docNumber: doc.doc_number || doc.docNumber,
    type: doc.type,
    status: doc.status,
    grandTotal: String(doc.grand_total || doc.grandTotal || "0"),
    issueDate: doc.issue_date || doc.issueDate,
    dueDate: doc.due_date || doc.dueDate,
    parentDocumentId: doc.parent_document_id || doc.parentDocumentId || null,
    parentDocument: doc.parentDocument || null,
    requiresEtims: doc.requires_etims ?? doc.requiresEtims,
    kraCuInvoiceNumber: doc.kra_cu_invoice_number || doc.kraCuInvoiceNumber,
    notes: doc.notes,
    supplier: {
      id: supplierRecord.id,
      name: supplierRecord.name,
      email: supplierRecord.email,
      phone: supplierRecord.phone,
      taxPin: supplierRecord.taxPin || supplierRecord.tax_pin,
    },
  }));

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* INTERFACE NAVIGATION HEADER */}
      <div className="space-y-3">
        <Link
          href={`/workspaces/${shopSlug}/suppliers`}
          className="text-xs font-sans font-bold text-zinc-400 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Supplier Registry
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Procurement Summary</span>
              {(supplierRecord.requires_etims || supplierRecord.requiresEtims) && (
                <span className="border border-amber-300 bg-amber-50 text-amber-900 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide rounded">
                  eTIMS Required
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans">
              {supplierRecord.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-600">
              <span className="border border-zinc-300 px-2 py-0.5 bg-zinc-50 font-semibold uppercase rounded text-zinc-700">
                Class: {supplierRecord.supplier_type || supplierRecord.supplierType}
              </span>
              {taxPin && (
                <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase tracking-wide rounded">
                  PIN: {taxPin}
                </span>
              )}
              <span className="text-zinc-400 font-mono text-[10px]">ID: {supplierRecord.id}</span>
            </div>
          </div>

          {/* STREAMLINED ACTION CONTROLS */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/workspaces/${shopSlug}/suppliers/${supplierRecord.id}/statement`}
              className="border border-zinc-300 bg-white hover:border-black px-3.5 py-2 font-mono font-semibold uppercase tracking-wider text-xs rounded-md shadow-2xs flex items-center gap-1.5 text-black"
            >
              <span>📑</span>
              <span>Statement</span>
            </Link>

            <Link
              href={`/workspaces/${shopSlug}/documents/new?supplierId=${supplierRecord.id}&type=LPO`}
              className="btn-primary-modern px-4 py-2 font-semibold uppercase tracking-wider text-xs shadow-sm flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Issue LPO</span>
            </Link>

            <SupplierActionsPopover
              supplier={{
                id: supplierRecord.id,
                name: supplierRecord.name,
                email: supplierRecord.email || "",
                phone: supplierRecord.phone || null,
                supplierType: supplierRecord.supplier_type || supplierRecord.supplierType || "CORPORATE",
                taxPin: taxPin || null,
                requiresEtims: Boolean(supplierRecord.requires_etims ?? supplierRecord.requiresEtims),
                paymentTerms: supplierRecord.payment_terms || supplierRecord.paymentTerms || "NET_30",
              }}
              shop={shop}
              shopSlug={shopSlug}
              matchedClient={matchedClient}
            />
          </div>
        </div>
      </div>

      {/* FINANCIAL SUMMARY CARDS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <p className="text-xs text-zinc-400 uppercase font-semibold">Total Procurement Spend</p>
          <p className="text-xl font-semibold tracking-tight text-black font-mono">
            {formatCurrency(totalProcurementSpend, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total settled procurement orders to date.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-xs text-zinc-400 uppercase font-semibold">Accounts Payable Debt</p>
          <p className="text-xl font-semibold tracking-tight text-black font-mono">
            {formatCurrency(accountsPayableDebt, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Outstanding pending payment vouchers &amp; bills.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="text-xs text-zinc-400 uppercase font-semibold">Payment Terms</p>
          <p className="text-xl font-semibold uppercase tracking-tight text-black font-mono">
            {supplierRecord.payment_terms || supplierRecord.paymentTerms || "NET_30"}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Agreed credit maturity timeframe.</p>
        </div>
      </div>

      {/* UNIFIED PROCUREMENT SUB-LEDGER TABLE */}
      <div className="space-y-4">
        <DocumentsTableClient
          slug={shopSlug}
          shopId={shop.id}
          currency={shop.currency}
          documents={streamDocs}
          docTypeTabs={SUPPLIER_DOC_TABS}
          embedded={true}
          title="Procurement Records & Lineage"
        />
      </div>
    </div>
  );
}
