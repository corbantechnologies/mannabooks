// src/app/workspaces/[slug]/documents/[id]/page.tsx
import { db } from "@/db";
import { documents, documentTokens, shops } from "@/db/schema";
import { eq, and, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency, isFiscalDocType } from "@/lib/utils";
import Link from "next/link";
import { DocumentStatusPanel } from "./DocumentStatusPanel";
import { DocumentChain, type ChainNode } from "@/components/DocumentChain";
import { PaymentHistorySubLedger } from "./PaymentHistorySubLedger";
import { DocumentInternalNotes } from "./DocumentInternalNotes";
import { ConversionAlertBanner } from "./ConversionAlertBanner";

interface DocumentDetailPageProps {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ converted?: string; from?: string }>;
}

export default async function DocumentDetailPage({ params, searchParams }: DocumentDetailPageProps) {
  const { slug, id } = await params;
  const { converted, from: fromDoc } = await searchParams;

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
      payments: {
        orderBy: (p, { desc }) => [desc(p.paymentDate)],
        with: { recordedBy: true },
      },
      notesList: {
        orderBy: (n, { desc }) => [desc(n.createdAt)],
        with: { user: true },
      },
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

  // Pre-capture shopId for use inside closures (TypeScript narrows undefined away)
  const shopId = shop.id;

  // Build full document chain (walk up to root, then fetch all descendants)
  const chain: ChainNode[] = [];
  try {
    // Walk upward to find root
    let rootId = doc.id;
    let cursor: typeof doc | null = doc as any;
    const visited = new Set<string>();
    while (cursor?.parentDocumentId && !visited.has(cursor.parentDocumentId)) {
      visited.add(cursor.parentDocumentId);
      const parent = await db.query.documents.findFirst({
        where: eq(documents.id, cursor.parentDocumentId),
      });
      if (parent) {
        rootId = parent.id;
        cursor = parent as any;
      } else break;
    }

    // Recursively fetch descendants from root
    async function fetchDescendants(docId: string, depth = 0): Promise<ChainNode[]> {
      if (depth > 6) return [];
      const node = await db.query.documents.findFirst({
        where: and(eq(documents.id, docId), eq(documents.shopId, shopId)),
      });
      if (!node) return [];
      const result: ChainNode[] = [{
        id: node.id,
        docNumber: node.docNumber,
        type: node.type,
        status: node.status,
        issueDate: node.issueDate,
      }];
      const children = await db.query.documents.findMany({
        where: and(eq(documents.parentDocumentId, node.id), eq(documents.shopId, shopId)),
        orderBy: (d, { asc }) => [asc(d.createdAt)],
      });
      for (const child of children) {
        const subtree = await fetchDescendants(child.id, depth + 1);
        result.push(...subtree);
      }
      return result;
    }

    const fullChain = await fetchDescendants(rootId);
    chain.push(...fullChain);
  } catch (_) {
    // Silently fail — chain is decorative
  }

  // 3. Fetch the public portal token
  const tokenRecord = await db.query.documentTokens.findFirst({
    where: eq(documentTokens.documentId, id),
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  const portalLink = tokenRecord ? `${appUrl}/portal/invoice/${tokenRecord.token}` : null;

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">

      {/* POST-CONVERSION SUCCESS BANNER */}
      {converted && fromDoc && (
        <ConversionAlertBanner
          convertedFromType={converted}
          sourceDocNumber={fromDoc}
          targetDocType={doc.type}
        />
      )}

      {/* BACK NAV + HEADER */}
      <div className="border-b border-zinc-200/80 pb-6 space-y-2">
        <Link
          href={`/workspaces/${slug}/documents`}
          className="font-sans text-xs font-bold text-zinc-400 hover:text-black hover:underline block"
        >
          ← Back to Billing &amp; Invoices
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-2">
          <div>
            <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Transaction Detail</span>
            <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">{doc.docNumber}</h1>
            <p className="font-sans text-xs text-zinc-500 mt-0.5">Party: <span className="font-semibold text-black">{party.name}</span></p>
          </div>
          <div className="flex gap-2 font-mono text-[10px] flex-wrap items-center">
            <span className="badge-zinc">{doc.type}</span>
            <span className={
              doc.status === "PAID" ? "badge-emerald" :
              doc.status === "ISSUED" ? "badge-zinc" :
              doc.status === "PARTIALLY_PAID" ? "badge-amber" :
              doc.status === "OVERDUE" ? "badge-rose" :
              "badge-zinc text-zinc-400"
            }>
              {doc.status}
            </span>
            {doc.emailDeliveryStatus === "OPENED" ? (
              <span className="badge-emerald" title={`Email opened on ${doc.lastEmailOpenedAt ? new Date(doc.lastEmailOpenedAt).toLocaleString() : ''}`}>
                👁️ Email Opened
              </span>
            ) : doc.emailDeliveryStatus === "DELIVERED" ? (
              <span className="bg-blue-50 text-blue-800 border border-blue-200 rounded-md px-2 py-0.5 font-semibold text-[10px] uppercase" title="Email delivered to recipient inbox">
                ✓✓ Email Delivered
              </span>
            ) : doc.emailDeliveryStatus === "BOUNCED" ? (
              <span className="badge-rose" title="Email bounced">
                ⚠️ Email Bounced
              </span>
            ) : doc.emailDeliveryStatus === "SENT" ? (
              <span className="badge-zinc" title="Email sent via mail gateway">
                ✓ Email Sent
              </span>
            ) : null}
            {doc.isReadByRecipient && doc.emailDeliveryStatus !== "OPENED" && (
              <span className="badge-emerald" title="Viewed via public client portal">
                👁️ Portal Viewed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* DOCUMENT JOURNEY CHAIN */}
      {chain.length > 1 && (
        <DocumentChain
          chain={chain}
          currentDocId={doc.id}
          shopSlug={slug}
        />
      )}

      {/* METADATA GRID */}
      <div className="card-modern grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 bg-white overflow-hidden">
        <div className="p-5 space-y-1">
          <p className="font-mono text-[10px] text-zinc-400 uppercase">{doc.supplier ? "Supplier" : "Client"}</p>
          {doc.client ? (
            <Link
              href={`/workspaces/${slug}/clients/${doc.client.id}`}
              className="font-bold uppercase text-sm hover:underline hover:text-emerald-800 block"
            >
              {party.name} ➔
            </Link>
          ) : doc.supplier ? (
            <Link
              href={`/workspaces/${slug}/suppliers/${doc.supplier.id}`}
              className="font-bold uppercase text-sm hover:underline hover:text-emerald-800 block"
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
          <p className="text-2xl font-bold font-mono tracking-tight text-emerald-800">{formatCurrency(doc.grandTotal, doc.currency || shop.currency)}</p>
          <p className="font-mono text-[10px] text-zinc-500">
            Sub: {formatCurrency(doc.subTotal, doc.currency || shop.currency)} | VAT: {formatCurrency(doc.taxAmount, doc.currency || shop.currency)}
          </p>
          {doc.currency && doc.currency !== (shop.currency || "KES") && (
            <div className="bg-amber-50 border border-amber-200 rounded p-2 text-[10px] font-sans text-amber-900 mt-1">
              <span className="font-bold block">Base Equivalent ({shop.currency || "KES"}): {formatCurrency(doc.baseGrandTotal || (parseFloat(doc.grandTotal) * parseFloat(doc.exchangeRate || "1")), shop.currency || "KES")}</span>
              <span className="text-[9px] text-amber-700 font-mono">1 {doc.currency} = {parseFloat(doc.exchangeRate || "1").toFixed(4)} {shop.currency || "KES"}</span>
            </div>
          )}
          {doc.kraCuInvoiceNumber ? (
            <p className="font-mono text-[10px] font-bold text-black border-t border-zinc-200 pt-1 mt-1">
              KRA eTIMS CU #: {doc.kraCuInvoiceNumber}
            </p>
          ) : isFiscalDocType(doc.type) && doc.requiresEtims ? (
            <div className="border-t border-zinc-200 pt-1 mt-1">
              <span className="inline-block border border-amber-400 bg-amber-50 text-amber-900 text-[10px] font-mono font-bold px-2 py-0.5 uppercase tracking-tight rounded-md">
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
        <h3 className="font-bold uppercase tracking-tight text-xs font-mono text-zinc-600">Line Item Breakdown</h3>
        <div className="card-modern overflow-x-auto overflow-hidden">
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
                <th className="p-3.5 border-r border-zinc-200">Description</th>
                <th className="p-3.5 border-r border-zinc-200 text-center">Qty</th>
                <th className="p-3.5 border-r border-zinc-200 text-right">Unit Rate</th>
                <th className="p-3.5 border-r border-zinc-200 text-center">Tax</th>
                <th className="p-3.5 border-r border-zinc-200 text-right">Tax Amt</th>
                <th className="p-3.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200/80 bg-white">
              {doc.items.map((item) => (
                <tr key={item.id} className="hover:bg-zinc-50/70 transition-colors">
                  <td className="p-3.5 border-r border-zinc-200/80 font-sans text-sm">
                    <div className="font-semibold text-black">{item.description}</div>
                    {item.notes && (
                      <div className="text-[10px] text-zinc-500 italic mt-0.5 font-mono">
                        ({item.notes})
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 border-r border-zinc-200/80 text-center">{item.quantity}</td>
                  <td className="p-3.5 border-r border-zinc-200/80 text-right font-bold">{formatCurrency(item.unitPrice, shop.currency)}</td>
                  <td className="p-3.5 border-r border-zinc-200/80 text-center">
                    <span className="badge-zinc">
                      {item.taxType === "V_16" ? "16% VAT" : item.taxType === "V_0" ? "0% ZERO" : "EXEMPT"}
                    </span>
                  </td>
                  <td className="p-3.5 border-r border-zinc-200/80 text-right text-zinc-600">{formatCurrency(item.taxAmount, shop.currency)}</td>
                  <td className="p-3.5 text-right font-bold text-black">{formatCurrency(item.itemTotal, shop.currency)}</td>
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

      {/* PAYMENT SETTLEMENT & INSTALLMENTS SUB-LEDGER */}
      {(doc.type === "INVOICE" || (doc.payments && doc.payments.length > 0)) && (
        <PaymentHistorySubLedger
          documentId={doc.id}
          shopId={shop.id}
          shopSlug={slug}
          currency={shop.currency || "KES"}
          grandTotal={doc.grandTotal}
          payments={doc.payments.map((p) => ({
            id: p.id,
            amount: p.amount,
            paymentDate: p.paymentDate,
            paymentChannel: p.paymentChannel,
            paymentReference: p.paymentReference,
            notes: p.notes,
            recordedBy: p.recordedBy ? { name: p.recordedBy.name } : null,
          }))}
          docStatus={doc.status}
        />
      )}

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
        initialPaymentChannel={doc.paymentChannel || doc.payments?.[0]?.paymentChannel || ""}
        initialPaymentReference={doc.paymentReference || doc.payments?.[0]?.paymentReference || ""}
        parentDocument={parentDoc ? { id: parentDoc.id, docNumber: parentDoc.docNumber, type: parentDoc.type } : null}
        shopName={shop.name}
        shopShortName={shop.shortName}
        shopPhone={shop.phone}
        shopEmail={shop.email}
        shopTaxPin={shop.taxPin}
        shopVatNumber={shop.vatNumber}
        currency={shop.currency || "KES"}
        subTotal={doc.subTotal}
        taxAmount={doc.taxAmount}
        grandTotal={doc.grandTotal}
        partyName={party.name}
        partyPhone={party.phone}
        partyTaxPin={party.taxPin}
        issueDate={doc.issueDate}
      />

      {/* INTERNAL NOTES & OPERATOR AUDIT TRAIL */}
      <DocumentInternalNotes
        documentId={doc.id}
        shopId={shop.id}
        shopSlug={slug}
        notes={doc.notesList.map((n) => ({
          id: n.id,
          note: n.note,
          createdAt: n.createdAt,
          user: n.user ? { name: n.user.name, email: n.user.email } : null,
        }))}
      />

    </div>
  );
}
