// src/app/workspaces/[slug]/documents/[id]/page.tsx
import { db } from "@/db";
import { documents, documentTokens, shops } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import Link from "next/link";
import { DocumentStatusPanel } from "./DocumentStatusPanel";

interface DocumentDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const { slug, id } = await params;

  // 1. Resolve shop
  const shop = await db.query.shops.findFirst({ where: eq(shops.slug, slug) });
  if (!shop) notFound();

  // 2. Fetch document with all related data & parent lineage
  const doc = await db.query.documents.findFirst({
    where: and(eq(documents.id, id), eq(documents.shopId, shop.id)),
    with: {
      client: true,
      supplier: true,
      items: true,
    },
  });
  if (!doc) notFound();

  const party = doc.client || doc.supplier || {
    name: doc.type === "PAYROLL_VOUCHER"
      ? "Internal Company Staff Payroll"
      : (doc.type === "RECEIPT" ? "Walk-in Customer" : (doc.type === "PAYMENT_VOUCHER" ? "Direct Vendor" : "Walk-in Customer")),
    email: "—",
    phone: null,
    taxPin: null,
  };

  // Fetch parent document if parentDocumentId exists
  let parentDoc = null;
  if (doc.parentDocumentId) {
    parentDoc = await db.query.documents.findFirst({
      where: eq(documents.id, doc.parentDocumentId),
    });
  }

  // 3. Fetch the public portal token
  const tokenRecord = await db.query.documentTokens.findFirst({
    where: eq(documentTokens.documentId, id),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const portalLink = tokenRecord ? `${appUrl}/portal/invoice/${tokenRecord.token}` : null;

  return (
    <div className="p-8 space-y-10 selection:bg-black selection:text-white">

      {/* BACK NAV + HEADER */}
      <div className="border-b border-black pb-6 space-y-2">
        <Link
          href={`/workspaces/${slug}/documents`}
          className="font-sans text-xs font-bold text-zinc-400 hover:underline block"
        >
          ← Back to Billing & Invoices
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
          <div>
            <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Transaction Detail</span>
            <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">{doc.docNumber}</h1>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">Party: {party.name}</p>
          </div>
          <div className="flex gap-2 font-mono text-[10px] flex-wrap">
            <span className="border border-black px-2 py-1 bg-zinc-50 font-bold uppercase">{doc.type}</span>
            <span className={`border px-2 py-1 font-bold uppercase ${
              doc.status === "PAID" ? "bg-black text-white border-black" :
              doc.status === "ISSUED" ? "bg-white text-black border-black" :
              doc.status === "OVERDUE" ? "bg-zinc-100 border-rose-600 border-dashed text-rose-700" :
              "bg-zinc-50 text-zinc-400 border-zinc-200"
            }`}>
              {doc.status}
            </span>
            {doc.isReadByRecipient && (
              <span className="border border-emerald-500 bg-emerald-50 text-emerald-800 px-2 py-1 font-bold uppercase" title="Viewed by recipient">
                👁️ Viewed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* METADATA GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border border-black divide-y sm:divide-y-0 sm:divide-x divide-black bg-white">
        <div className="p-5 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase">{doc.supplier ? "Supplier" : "Client"}</p>
          {doc.client ? (
            <Link
              href={`/workspaces/${slug}/clients/${doc.client.id}`}
              className="font-bold uppercase text-sm hover:underline hover:text-black block"
            >
              {party.name} ➔
            </Link>
          ) : doc.supplier ? (
            <Link
              href={`/workspaces/${slug}/suppliers/${doc.supplier.id}`}
              className="font-bold uppercase text-sm hover:underline hover:text-black block"
            >
              {party.name} ➔
            </Link>
          ) : (
            <p className="font-bold uppercase text-sm">{party.name}</p>
          )}
          <p className="font-mono text-xs text-zinc-500">{party.email}</p>
          {party.taxPin && (
            <p className="font-mono text-[10px] text-zinc-600">PIN: {party.taxPin}</p>
          )}
        </div>
        <div className="p-5 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase">Date Issued</p>
          <p className="font-bold text-sm">{new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "long" })}</p>
          {doc.dueDate && (
            <>
              <p className="font-mono text-[10px] text-zinc-400 uppercase mt-2">Due Date</p>
              <p className="font-bold text-sm">{new Date(doc.dueDate).toLocaleDateString("en-KE", { dateStyle: "long" })}</p>
            </>
          )}
        </div>
        <div className="p-5 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase">Grand Total</p>
          <p className="text-2xl font-bold font-mono tracking-tight">{formatCurrency(doc.grandTotal, shop.currency)}</p>
          <p className="font-mono text-[10px] text-zinc-500">
            Sub: {formatCurrency(doc.subTotal, shop.currency)} | VAT: {formatCurrency(doc.taxAmount, shop.currency)}
          </p>
          {doc.kraCuInvoiceNumber ? (
            <p className="font-mono text-[10px] font-bold text-black border-t border-zinc-200 pt-1 mt-1">
              KRA eTIMS CU #: {doc.kraCuInvoiceNumber}
            </p>
          ) : doc.requiresEtims ? (
            <div className="border-t border-zinc-200 pt-1 mt-1">
              <span className="inline-block border border-amber-400 bg-amber-50 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-tight">
                ⚠️ eTIMS CU Serial Pending
              </span>
            </div>
          ) : null}
          {(doc.paymentChannel || doc.paymentReference) && (
            <div className="font-mono text-[10px] border-t border-zinc-200 pt-1 mt-1 space-y-0.5">
              {doc.paymentChannel && <p className="font-bold uppercase text-black">Paid via: {doc.paymentChannel}</p>}
              {doc.paymentReference && <p className="text-zinc-600">Ref #: {doc.paymentReference}</p>}
            </div>
          )}
        </div>
      </div>

      {/* LINE ITEMS TABLE */}
      <div className="space-y-3">
        <h3 className="font-bold uppercase tracking-tight text-sm font-mono">{">"} Line Item Breakdown</h3>
        <div className="border border-black bg-white overflow-x-auto">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50 border-b border-black uppercase tracking-wider font-bold">
                <th className="p-4 border-r border-black">Description</th>
                <th className="p-4 border-r border-black text-center">Qty</th>
                <th className="p-4 border-r border-black text-right">Unit Rate</th>
                <th className="p-4 border-r border-black text-center">Tax</th>
                <th className="p-4 border-r border-black text-right">Tax Amt</th>
                <th className="p-4 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black">
              {doc.items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50">
                  <td className="p-4 border-r border-black font-sans text-sm">
                    <div className="font-semibold text-black">{item.description}</div>
                    {item.notes && (
                      <div className="text-[10px] text-zinc-500 italic mt-0.5 font-mono">
                        ({item.notes})
                      </div>
                    )}
                  </td>
                  <td className="p-4 border-r border-black text-center">{item.quantity}</td>
                  <td className="p-4 border-r border-black text-right font-bold">{formatCurrency(item.unitPrice, shop.currency)}</td>
                  <td className="p-4 border-r border-black text-center">
                    <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase border ${
                      item.taxType === "V_16" ? "bg-black text-white border-black" :
                      item.taxType === "V_0" ? "border-zinc-400 text-zinc-600" :
                      "border-dashed border-zinc-300 text-zinc-400"
                    }`}>
                      {item.taxType}
                    </span>
                  </td>
                  <td className="p-4 border-r border-black text-right text-zinc-600">{formatCurrency(item.taxAmount, shop.currency)}</td>
                  <td className="p-4 text-right font-bold text-black">{formatCurrency(item.itemTotal, shop.currency)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* COMMERCIAL TERMS & CONDITIONS */}
      {(() => {
        let parsedTerms: string[] = [];
        if (doc.termsAndConditions) {
          try {
            const parsed = JSON.parse(doc.termsAndConditions);
            if (Array.isArray(parsed)) {
              parsedTerms = parsed;
            } else if (typeof parsed === "string") {
              parsedTerms = [parsed];
            }
          } catch {
            parsedTerms = [doc.termsAndConditions];
          }
        }
        if (parsedTerms.length === 0) return null;
        return (
          <div className="border border-zinc-200 bg-zinc-50/70 p-4 rounded-lg space-y-2 font-mono text-xs">
            <span className="text-black font-bold uppercase tracking-tight text-[11px] block border-b border-zinc-200 pb-1 flex items-center gap-1.5">
              <span>📜</span>
              <span>Commercial Terms &amp; Conditions Attached:</span>
            </span>
            <ul className="space-y-1 font-sans text-xs text-zinc-700">
              {parsedTerms.map((term, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-black font-bold">•</span>
                  <span>{term}</span>
                </li>
              ))}
            </ul>
          </div>
        );
      })()}

      {/* STATUS + ACTIONS PANEL */}
      <DocumentStatusPanel
        documentId={doc.id}
        shopId={shop.id}
        shopSlug={slug}
        currentStatus={doc.status}
        docType={doc.type as any}
        items={doc.items.map((i) => ({
          id: i.id,
          description: i.description,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          itemTotal: i.itemTotal,
        }))}
        portalLink={portalLink}
        clientEmail={party.email}
        docNumber={doc.docNumber}
        kraCuInvoiceNumber={doc.kraCuInvoiceNumber}
        requiresEtims={doc.requiresEtims}
        initialPaymentChannel={doc.paymentChannel}
        initialPaymentReference={doc.paymentReference}
        parentDocument={parentDoc ? { id: parentDoc.id, docNumber: parentDoc.docNumber, type: parentDoc.type } : null}
      />

    </div>
  );
}
