"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { LedgerFilterBar } from "./LedgerFilterBar";
import { PipelineView } from "@/components/PipelineView";
import { DocumentExportActions } from "./DocumentExportActions";
import { DocumentsTableClient } from "./DocumentsTableClient";
import { useDocuments } from "@/hooks/useDocuments";
import { useClients } from "@/hooks/useClients";
import { Spinner } from "@/components/Spinner";

const DOC_TYPE_TABS = [
  { key: "ALL", label: "All" },
  { key: "INVOICE", label: "Invoices" },
  { key: "QUOTATION", label: "Quotes" },
  { key: "RECEIPT", label: "Receipts" },
  { key: "CREDIT_NOTE", label: "Credit Notes" },
  { key: "LPO", label: "LPO" },
  { key: "DELIVERY_NOTE", label: "Delivery" },
  { key: "PAYMENT_VOUCHER", label: "Vouchers" },
];

interface DocumentsPageClientProps {
  shopId: string;
  shopSlug: string;
  currency: string;
}

export function DocumentsPageClient({
  shopId,
  shopSlug,
  currency,
}: DocumentsPageClientProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search");
  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const clientId = searchParams.get("clientId");
  const fromDate = searchParams.get("fromDate");
  const toDate = searchParams.get("toDate");
  const view = searchParams.get("view");

  const activeType = type || "ALL";
  const activeStatus = status || "ALL";
  const activeClientId = clientId || "ALL";
  const isPipelineView = view === "pipeline";

  const { data: rawClients = [], isLoading: isLoadingClients } = useClients(shopId);
  const { data: rawDocs = [], isLoading: isLoadingDocs } = useDocuments(shopId);

  const shopClients = useMemo(() => {
    return (Array.isArray(rawClients) ? rawClients : []).sort((a: any, b: any) =>
      (b.name || "").localeCompare(a.name || "")
    );
  }, [rawClients]);

  const streamLedger = useMemo(() => {
    let docs = (Array.isArray(rawDocs) ? rawDocs : []).map((doc: any) => ({
      id: doc.id,
      docNumber: doc.doc_number || doc.docNumber,
      type: doc.type,
      status: doc.status,
      grandTotal: String(doc.grand_total || doc.grandTotal || "0"),
      subTotal: String(doc.sub_total || doc.subTotal || "0"),
      taxAmount: String(doc.tax_amount || doc.taxTotal || doc.taxAmount || "0"),
      issueDate: doc.issue_date || doc.issueDate,
      dueDate: doc.due_date || doc.dueDate,
      parentDocumentId: doc.parent_document_id || doc.parentDocumentId || null,
      parentDocument: doc.parentDocument || null,
      requiresEtims: doc.requires_etims ?? doc.requiresEtims,
      kraCuInvoiceNumber: doc.kra_cu_invoice_number || doc.kraCuInvoiceNumber,
      attachmentUrl: doc.attachment_url || doc.attachmentUrl,
      attachmentName: doc.attachment_name || doc.attachmentName,
      attachmentSize: doc.attachment_size || doc.attachmentSize,
      client: doc.client
        ? {
            id: doc.client.id,
            name: doc.client.name,
            email: doc.client.email,
            phone: doc.client.phone,
            taxPin: doc.client.tax_pin || doc.client.taxPin,
          }
        : null,
      supplier: doc.supplier
        ? {
            id: doc.supplier.id,
            name: doc.supplier.name,
            email: doc.supplier.email,
            phone: doc.supplier.phone,
            taxPin: doc.supplier.tax_pin || doc.supplier.taxPin,
          }
        : null,
    }));

    if (activeType !== "ALL") {
      docs = docs.filter((d: any) => d.type === activeType);
    }
    if (activeStatus !== "ALL") {
      docs = docs.filter((d: any) => d.status === activeStatus);
    }
    if (activeClientId !== "ALL") {
      docs = docs.filter((d: any) => d.client?.id === activeClientId);
    }

    if (search && search.trim() !== "") {
      const q = search.toLowerCase().trim();
      docs = docs.filter(
        (doc: any) =>
          doc.docNumber.toLowerCase().includes(q) ||
          (doc.client?.name || doc.supplier?.name || "").toLowerCase().includes(q)
      );
    }

    if (fromDate) {
      const fromTime = new Date(fromDate).getTime();
      docs = docs.filter((doc: any) => new Date(doc.issueDate).getTime() >= fromTime);
    }

    if (toDate) {
      const toTime = new Date(toDate).getTime() + 86400000;
      docs = docs.filter((doc: any) => new Date(doc.issueDate).getTime() <= toTime);
    }

    return docs;
  }, [rawDocs, activeType, activeStatus, activeClientId, search, fromDate, toDate]);

  // Compute stats
  const { outstanding, overdueCount, paidThisMonth, openQuotes } = useMemo(() => {
    const all = Array.isArray(rawDocs) ? rawDocs : [];
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const out = all
      .filter(
        (d: any) =>
          (d.status === "ISSUED" || d.status === "PARTIALLY_PAID") &&
          (d.type === "INVOICE" || d.type === "RECEIPT")
      )
      .reduce((acc: number, d: any) => acc + parseFloat(d.grand_total || d.grandTotal || "0"), 0);

    const overdue = all.filter(
      (d: any) =>
        d.type === "INVOICE" &&
        d.status === "ISSUED" &&
        (d.due_date || d.dueDate) &&
        new Date(d.due_date || d.dueDate) < now
    ).length;

    const paidMonth = all
      .filter((d: any) => {
        const isSales = d.type === "INVOICE" || d.type === "RECEIPT";
        const isReceiptFromInvoice =
          d.type === "RECEIPT" && Boolean(d.parent_document_id || d.parentDocumentId);
        const issueDate = d.issue_date || d.issueDate;
        return (
          isSales &&
          !isReceiptFromInvoice &&
          d.status === "PAID" &&
          issueDate &&
          new Date(issueDate) >= startOfMonth
        );
      })
      .reduce((acc: number, d: any) => acc + parseFloat(d.grand_total || d.grandTotal || "0"), 0);

    const quotes = all.filter(
      (d: any) => d.type === "QUOTATION" && d.status !== "CANCELLED"
    ).length;

    return {
      outstanding: out,
      overdueCount: overdue,
      paidThisMonth: paidMonth,
      openQuotes: quotes,
    };
  }, [rawDocs]);

  if (isLoadingClients || isLoadingDocs) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading billing stream &amp; documents...</p>
      </div>
    );

  }

  const now = new Date();

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* HEADER SECTION AREA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Transaction Stream</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Billing &amp; Invoices</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <DocumentExportActions
            shopSlug={shopSlug}
            currency={currency}
            documents={streamLedger}
          />
          <Link
            href={`/workspaces/${shopSlug}/documents/new`}
            className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider text-center"
          >
            + Generate Document
          </Link>
        </div>
      </div>

      {/* STATS STRIP */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="stat-card p-4 space-y-1">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Outstanding</p>
          <p className="font-mono text-lg font-black text-black leading-tight">{formatCurrency(outstanding, currency)}</p>
          <p className="text-[10px] text-zinc-500 font-sans">Issued &amp; partial invoices</p>
        </div>
        <div className="stat-card p-4 space-y-1">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Overdue</p>
          <p className="font-mono text-lg font-black text-rose-600 leading-tight">{overdueCount}</p>
          <p className="text-[10px] text-zinc-500 font-sans">Past due date invoices</p>
        </div>
        <div className="stat-card p-4 space-y-1">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Paid This Month</p>
          <p className="font-mono text-lg font-black text-emerald-700 leading-tight">{formatCurrency(paidThisMonth, currency)}</p>
          <p className="text-[10px] text-zinc-500 font-sans">Collected in {now.toLocaleString("en-KE", { month: "long" })}</p>
        </div>
        <div className="stat-card p-4 space-y-1">
          <p className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide">Open Quotes</p>
          <p className="font-mono text-lg font-black text-blue-700 leading-tight">{openQuotes}</p>
          <p className="text-[10px] text-zinc-500 font-sans">Awaiting conversion</p>
        </div>
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <LedgerFilterBar clients={shopClients} />

      {/* TOOLBAR: TYPE TABS + VIEW TOGGLE */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        {/* Scrollable type tabs */}
        <div className="overflow-x-auto -mx-1 px-1">
          <div className="flex border border-zinc-200/80 divide-x divide-zinc-200/80 bg-white font-mono text-[10px] uppercase w-fit rounded shadow-xs">
            {DOC_TYPE_TABS.map((t) => {
              const isActive = activeType === t.key;
              return (
                <Link
                  key={t.key}
                  href={`/workspaces/${shopSlug}/documents?type=${t.key}${view ? `&view=${view}` : ""}`}
                  className={`px-3 py-2 font-semibold transition-colors whitespace-nowrap ${
                    isActive ? "bg-black text-white font-semibold" : "bg-white text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  {t.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* View Toggle: Table / Pipeline */}
        <div className="flex border border-zinc-200 rounded overflow-hidden font-mono text-[10px] font-bold uppercase shrink-0">
          <Link
            href={`/workspaces/${shopSlug}/documents?type=${activeType}`}
            className={`px-3 py-2 flex items-center gap-1.5 transition-colors ${!isPipelineView ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            <span>☰</span>
            <span>Table</span>
          </Link>
          <Link
            href={`/workspaces/${shopSlug}/documents?type=${activeType}&view=pipeline`}
            className={`px-3 py-2 flex items-center gap-1.5 transition-colors border-l border-zinc-200 ${isPipelineView ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"}`}
          >
            <span>⬛</span>
            <span>Pipeline</span>
          </Link>
        </div>
      </div>

      {/* PIPELINE OR TABLE VIEW */}
      {isPipelineView ? (
        <PipelineView
          docs={streamLedger.map((d: any) => ({
            id: d.id,
            docNumber: d.docNumber,
            type: d.type,
            status: d.status,
            grandTotal: d.grandTotal,
            issueDate: String(d.issueDate),
            clientName: d.client?.name || d.supplier?.name,
            slug: shopSlug,
          }))}
          currency={currency}
        />
      ) : (
        <DocumentsTableClient
          slug={shopSlug}
          shopId={shopId}
          currency={currency}
          activeType={activeType}
          docTypeTabs={DOC_TYPE_TABS}
          documents={streamLedger.map((doc: any) => ({
            id: doc.id,
            docNumber: doc.docNumber,
            type: doc.type,
            status: doc.status,
            grandTotal: doc.grandTotal,
            issueDate: String(doc.issueDate),
            parentDocumentId: doc.parentDocumentId || null,
            parentDocument: doc.parentDocument
              ? {
                  id: doc.parentDocument.id,
                  docNumber: doc.parentDocument.docNumber,
                  type: doc.parentDocument.type,
                  status: doc.parentDocument.status,
                  grandTotal: doc.parentDocument.grandTotal,
                  issueDate: String(doc.parentDocument.issueDate),
                }
              : null,
            requiresEtims: doc.requiresEtims,
            kraCuInvoiceNumber: doc.kraCuInvoiceNumber,
            attachmentUrl: doc.attachmentUrl,
            attachmentName: doc.attachmentName,
            attachmentSize: doc.attachmentSize,
            client: doc.client
              ? {
                  id: doc.client.id,
                  name: doc.client.name,
                  email: doc.client.email,
                  phone: doc.client.phone,
                  taxPin: doc.client.taxPin,
                }
              : null,
            supplier: doc.supplier
              ? {
                  id: doc.supplier.id,
                  name: doc.supplier.name,
                  email: doc.supplier.email,
                  phone: doc.supplier.phone,
                  taxPin: doc.supplier.taxPin,
                }
              : null,
          }))}
        />
      )}
    </div>
  );
}
