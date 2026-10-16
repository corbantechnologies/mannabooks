"use client";

import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { ClientActionsPopover } from "./ClientActionsPopover";
import { DocumentsTableClient, type StreamDocument } from "../../documents/DocumentsTableClient";
import { useClient } from "@/hooks/useClients";
import { useClientDocuments } from "@/hooks/useDocuments";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useLoyaltyProgram } from "@/hooks/useLoyalty";
import { Spinner } from "@/components/Spinner";

interface ClientProfileClientProps {
  shop: any;
  shopSlug: string;
  clientId: string;
}

export function ClientProfileClient({ shop, shopSlug, clientId }: ClientProfileClientProps) {
  const { data: rawClient, isLoading: isLoadingClient, error: clientError } = useClient(
    shop.id,
    clientId
  );
  const { data: rawDocs = [], isLoading: isLoadingDocs } = useClientDocuments(shop.id, clientId);
  const { data: rawSuppliers = [] } = useSuppliers(shop.id);
  const { data: loyaltyData } = useLoyaltyProgram(shop.id);

  if (isLoadingClient || isLoadingDocs) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading client ledger &amp; profile...</p>
      </div>
    );

  }

  if (clientError || !rawClient) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-sm text-rose-600 font-semibold">Client profile not found or could not be loaded.</p>
        <Link
          href={`/workspaces/${shopSlug}/clients`}
          className="btn-secondary-modern px-4 py-2 text-xs uppercase"
        >
          ← Back to Client Directory
        </Link>
      </div>
    );
  }

  const clientRecord = {
    ...rawClient,
    id: rawClient.id,
    name: rawClient.name,
    email: rawClient.email,
    phone: rawClient.phone,
    clientType: rawClient.client_type || rawClient.clientType,
    taxPin: rawClient.tax_pin || rawClient.taxPin,
    requiresEtims: rawClient.requires_etims ?? rawClient.requiresEtims,
    createdAt: rawClient.created_at || rawClient.createdAt || new Date().toISOString(),
  };

  const docs: StreamDocument[] = (Array.isArray(rawDocs) ? rawDocs : []).map((d: any) => ({
    id: d.id,
    docNumber: d.doc_number || d.docNumber,
    type: d.type,
    status: d.status,
    grandTotal: String(d.grand_total || d.grandTotal || "0"),
    issueDate: d.issue_date || d.issueDate,
    dueDate: d.due_date || d.dueDate,
    parentDocumentId: d.parent_document_id || d.parentDocumentId || null,
    parentDocument: d.parentDocument || null,
    requiresEtims: d.requires_etims ?? d.requiresEtims,
    kraCuInvoiceNumber: d.kra_cu_invoice_number || d.kraCuInvoiceNumber,
    notes: d.notes,
    client: {
      id: clientRecord.id,
      name: clientRecord.name,
      email: clientRecord.email,
      phone: clientRecord.phone,
      taxPin: clientRecord.taxPin,
    },
  }));

  const suppliersList = Array.isArray(rawSuppliers) ? rawSuppliers : [];
  const matchedSupplier = suppliersList.find((s: any) => {
    const sPin = s.tax_pin || s.taxPin;
    const cPin = clientRecord.taxPin;
    if (cPin && sPin) return sPin === cPin || s.email === clientRecord.email;
    return s.email && s.email === clientRecord.email;
  }) || null;

  const performanceMetrics = docs.reduce(
    (acc: { lifetimeValue: number; outstandingLiability: number; overdueLiability: number }, doc: any) => {
      const value = parseFloat(doc.grandTotal) || 0;
      if (doc.type === "RECEIPT") {
        acc.lifetimeValue += value;
      } else if (doc.type === "INVOICE") {
        if (doc.status === "ISSUED" || doc.status === "PARTIALLY_PAID") {
          acc.outstandingLiability += value;
        } else if (doc.status === "OVERDUE") {
          acc.outstandingLiability += value;
          acc.overdueLiability += value;
        }
      } else if (doc.type === "CREDIT_NOTE" && doc.status === "PAID") {
        acc.lifetimeValue -= value;
      }
      return acc;
    },
    { lifetimeValue: 0, outstandingLiability: 0, overdueLiability: 0 }
  );

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* BACK NAVIGATION AND INTERFACE HEADER */}
      <div className="space-y-3">
        <Link
          href={`/workspaces/${shopSlug}/clients`}
          className="font-sans text-xs font-bold text-zinc-400 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Client Directory
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Customer Statement</span>
              {clientRecord.requiresEtims && (
                <span className="border border-amber-300 bg-amber-50 text-amber-900 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide rounded">
                  eTIMS Required
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans">
              {clientRecord.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-600">
              <span className="border border-zinc-300 px-2 py-0.5 bg-zinc-50 font-semibold uppercase rounded text-zinc-700">
                Class: {clientRecord.clientType}
              </span>
              {clientRecord.taxPin && (
                <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase tracking-wide rounded">
                  PIN: {clientRecord.taxPin}
                </span>
              )}
              <span className="text-zinc-400 font-mono text-[10px]">ID: {clientRecord.id}</span>
            </div>
          </div>

          {/* STREAMLINED ACTION CONTROLS */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/workspaces/${shopSlug}/clients/${clientRecord.id}/statement`}
              className="border border-zinc-300 bg-white hover:border-black px-3.5 py-2 font-mono font-semibold uppercase tracking-wider text-xs rounded-md shadow-2xs flex items-center gap-1.5 text-black"
            >
              <span>📑</span>
              <span>Statement</span>
            </Link>

            <Link
              href={`/workspaces/${shopSlug}/documents/new?clientId=${clientRecord.id}`}
              className="btn-primary-modern px-4 py-2 font-semibold uppercase tracking-wider text-xs shadow-sm flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Generate Document</span>
            </Link>

            <ClientActionsPopover
              client={{
                ...clientRecord,
                documents: docs,
              }}
              shop={shop}
              shopSlug={shopSlug}
              matchedSupplier={matchedSupplier}
            />
          </div>
        </div>
      </div>

      {/* INDIVIDUAL PIPELINE FINANCIAL SUMMARY CARD BLOCKS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <p className="font-mono text-xs text-zinc-400 uppercase font-semibold">Computed Lifetime Value (LTV)</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {formatCurrency(performanceMetrics.lifetimeValue, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total settled invoice balances explicitly processed to date.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-xs text-zinc-400 uppercase font-semibold">Accounts Receivable Debt</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {formatCurrency(performanceMetrics.outstandingLiability, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Pending un-settled balance vectors current in processing paths.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-xs text-zinc-400 uppercase font-semibold">Critically Overdue Pool</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-rose-600">
            {formatCurrency(performanceMetrics.overdueLiability, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Outstanding invoice values that have cleared their due date constraints.</p>
        </div>
      </div>

      {/* CORE CONTACT SCHEDULING DETAILS BOX */}
      <div className="card-modern p-4 bg-zinc-50/50 font-mono text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Email Address</span>
          <span className="font-sans font-semibold text-black text-sm">{clientRecord.email}</span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Phone Number</span>
          <span className="font-semibold text-black text-sm">{clientRecord.phone || "Not set"}</span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Client Since</span>
          <span className="text-zinc-600 text-sm font-semibold">
            {new Date(clientRecord.createdAt).toLocaleDateString("en-KE", { dateStyle: "long" })}
          </span>
        </div>
      </div>

      {/* UNIFIED CLIENT DOCUMENTS SUB-LEDGER */}
      <div className="space-y-4">
        <DocumentsTableClient
          slug={shopSlug}
          shopId={shop.id}
          currency={shop.currency}
          documents={docs}
          embedded={true}
          title="Customer Transactions & Lineage"
        />
      </div>
    </div>
  );
}
