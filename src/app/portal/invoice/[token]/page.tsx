// src/app/portal/invoice/[token]/page.tsx
import { db } from "@/db";
import { documentTokens, documents, shops, paymentMethods } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import crypto from "crypto";
import QRCode from "react-qr-code";

interface PortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicInvoicePortalPage({ params }: PortalPageProps) {
  const { token } = await params;

  // 1. Multi-tier resilient token & document resolver
  let targetDocumentId: string | null = null;

  // Tier 1: Look up exact token match in documentTokens
  const tokenRecord = await db.query.documentTokens.findFirst({
    where: eq(documentTokens.token, token),
  });
  if (tokenRecord) {
    targetDocumentId = tokenRecord.documentId;
  }

  // Tier 2: Look up if token parameter is a documentId in documentTokens
  if (!targetDocumentId) {
    const tokenByDoc = await db.query.documentTokens.findFirst({
      where: eq(documentTokens.documentId, token),
    });
    if (tokenByDoc) {
      targetDocumentId = tokenByDoc.documentId;
    }
  }

  // Tier 3: Direct lookup in documents table (auto-provisions missing token for legacy docs)
  if (!targetDocumentId) {
    const directDoc = await db.query.documents.findFirst({
      where: eq(documents.id, token),
    });
    if (directDoc) {
      targetDocumentId = directDoc.id;
      try {
        const fallbackToken = token.length === 64 ? token : crypto.randomBytes(32).toString("hex");
        await db.insert(documentTokens).values({
          documentId: directDoc.id,
          token: fallbackToken,
        }).onConflictDoNothing();
      } catch (err) {
        // Ignore duplicate token race condition
      }
    }
  }

  if (!targetDocumentId) {
    notFound();
  }

  // 2. Query full document with client, supplier, shop, and line items
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, targetDocumentId),
    with: {
      client: true,
      supplier: true,
      shop: true,
      items: true,
    },
  });

  if (!doc) {
    notFound();
  }

  const shop = doc.shop;
  const party = doc.client || doc.supplier || {
    name: doc.type === "PAYROLL_VOUCHER"
      ? "Internal Company Staff Payroll"
      : (doc.type === "RECEIPT" ? "Walk-in Customer" : (doc.type === "PAYMENT_VOUCHER" ? "Direct Vendor" : "Walk-in Customer")),
    email: "—",
    phone: null,
    taxPin: null,
  };

  // 2. Fetch the active shop payment instructions to show settlement channels
  const activeSettlements = await db.query.paymentMethods.findMany({
    where: eq(paymentMethods.shopId, shop.id),
  });

  const brandColor = shop.primaryColor || "#000000";

  return (
    <div className="min-h-screen bg-zinc-50 py-6 sm:py-12 px-3 sm:px-6 font-mono text-xs text-black selection:bg-black selection:text-white">
      <style>{`
        :root {
          --brand-primary: ${brandColor};
        }
        ::selection {
          background-color: ${brandColor} !important;
          color: #ffffff !important;
        }
        .bg-black {
          background-color: ${brandColor} !important;
        }
        .border-black {
          border-color: ${brandColor} !important;
        }
        .divide-black > :not([hidden]) ~ :not([hidden]) {
          border-color: ${brandColor} !important;
        }
        .hover\\:bg-black:hover {
          background-color: ${brandColor} !important;
        }
      `}</style>
      
      {doc.requiresEtims && !doc.kraCuInvoiceNumber && (
        <div className="max-w-3xl mx-auto mb-6 bg-amber-50 border border-amber-300 rounded-lg p-4 shadow-sm animate-in fade-in slide-in-from-top-4">
          <h3 className="font-bold text-amber-900 uppercase text-xs flex items-center gap-2">
            <span>⚠️</span> KRA eTIMS CU Pending
          </h3>
          <p className="text-amber-800 text-[11px] font-sans mt-1">
            This receipt is provisional. Your finalized KRA tax control number is being processed and will appear here shortly. Please check back later to download your finalized statutory PDF.
          </p>
        </div>
      )}

      <div className="max-w-3xl mx-auto card-modern p-6 sm:p-12 space-y-8 sm:space-y-10 shadow-sm">
        
        {/* PUBLIC PORTAL BRAND HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-zinc-200/80 pb-8">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold uppercase tracking-tight font-sans" style={{ color: brandColor }}>
              {shop.shortName || shop.name}
            </h1>
            {shop.taxPin && <p className="text-[11px] text-zinc-500">Tax PIN: {shop.taxPin}</p>}
            {shop.phone && <p className="text-[11px] text-zinc-500">Tel: {shop.phone}</p>}
            {shop.website && (
              <a href={shop.website} target="_blank" rel="noopener noreferrer" className="text-[11px] underline block font-semibold" style={{ color: brandColor }}>
                {shop.website}
              </a>
            )}
            <p className="text-zinc-500 font-sans italic lowercase">Origin: Secure Ledger Channel</p>
          </div>
          
          <div className="text-left sm:text-right space-y-1">
            <div
              className="inline-block border border-black px-2.5 py-0.5 font-semibold uppercase tracking-wider text-[10px] rounded"
              style={{ backgroundColor: brandColor, color: "#ffffff" }}
            >
              {doc.type} SNAPSHOT
            </div>
            <p className="text-base font-semibold mt-1 font-mono" style={{ color: brandColor }}>{doc.docNumber}</p>
            {doc.kraCuInvoiceNumber ? (
              <p className="text-[10px] font-semibold text-black border border-zinc-300 px-1.5 py-0.5 bg-zinc-50 inline-block rounded">
                KRA eTIMS CU #: {doc.kraCuInvoiceNumber}
              </p>
            ) : doc.requiresEtims ? (
              <p className="text-[10px] font-semibold text-amber-900 border border-amber-300 bg-amber-50 px-1.5 py-0.5 inline-block rounded">
                ⚠️ eTIMS CU Serial Pending
              </p>
            ) : null}
            {(doc.paymentChannel || doc.paymentReference) && (
              <p className="text-[10px] font-semibold text-emerald-800 border border-emerald-300 bg-emerald-50 px-2 py-0.5 inline-block rounded">
                {doc.paymentChannel ? `SETTLED VIA: ${doc.paymentChannel}` : "SETTLED"} {doc.paymentReference ? `(Ref: ${doc.paymentReference})` : ""}
              </p>
            )}
            <p className="text-zinc-500">Issued: {new Date(doc.issueDate).toLocaleDateString()}</p>
            {doc.dueDate && <p className="text-rose-600 font-semibold">Maturity: {new Date(doc.dueDate).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* METADATA CLIENT / SUPPLIER ROUTING PARTICULARS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-zinc-200/80 pb-8">
          <div className="space-y-1">
            <span className="text-zinc-400 uppercase text-[10px] block font-semibold">
              {doc.supplier ? "Supplier Destination:" : "Billing Destination:"}
            </span>
            <p className="font-sans text-sm font-semibold uppercase text-black">{party.name}</p>
            <p className="font-sans text-zinc-600">{party.email}</p>
            {party.phone && <p className="text-zinc-600">{party.phone}</p>}
            {party.taxPin && <p className="text-black font-semibold">Tax PIN: {party.taxPin}</p>}
          </div>
          
          <div className="space-y-2 sm:text-right">
            <span className="text-zinc-400 uppercase text-[10px] block font-semibold">Current Status:</span>
            <span className={`inline-block border px-3 py-1 font-semibold text-xs uppercase tracking-widest rounded ${
              doc.status === "PAID" ? "bg-black text-white border-black" : "bg-white text-rose-600 border-rose-400"
            }`}>
              {doc.status}
            </span>
            <div className="pt-2">
              <a 
                href={`/portal/pdf/${token}`}
                className="btn-secondary-modern px-4 py-1.5 text-[10px] font-semibold uppercase inline-block"
              >
                ↓ Download Vector PDF
              </a>
            </div>
          </div>
        </div>

        {/* EXPLICIT TRANSACTION LINE ITEM MATRIX */}
        <div className="space-y-2">
          <span className="text-zinc-400 uppercase text-[10px] block">Itemization Sub-Ledger:</span>
          <div className="border border-black overflow-x-auto">
            <div className="min-w-[600px]">
              <div className="grid grid-cols-12 bg-zinc-50 border-b border-black p-3 font-bold uppercase text-[10px] tracking-tight">
                <div className="col-span-6">Description / Core Deliverable</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-right">Unit Rate</div>
                <div className="col-span-2 text-right">Line Total</div>
              </div>
              
              <div className="divide-y divide-zinc-200 bg-white">
                {doc.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-12 p-3 items-center font-sans text-xs">
                    <div className="col-span-6 font-bold text-black uppercase tracking-tight">
                      <div>{item.description}</div>
                      {item.notes && (
                        <div className="text-[10px] text-zinc-500 italic mt-0.5 font-mono lowercase">
                          ({item.notes})
                        </div>
                      )}
                    </div>
                    <div className="col-span-2 text-center font-mono text-xs">{item.quantity}</div>
                    <div className="col-span-2 text-right font-mono text-xs">{formatCurrency(item.unitPrice, shop.currency)}</div>
                    <div className="col-span-2 text-right font-mono text-xs font-bold text-black">{formatCurrency(item.itemTotal, shop.currency)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SUMMATION BALANCE SNAPSHOT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 pt-4">
          <div className="md:col-span-6 space-y-4 border border-black p-4 bg-zinc-50">
            <span className="text-black font-bold uppercase tracking-tight text-[10px] block border-b border-zinc-300 pb-1">
              Official Remittance & Payment Pathways
            </span>
            <div className="space-y-3">
              {activeSettlements.map((pay) => {
                const parts = pay.details.includes("|")
                  ? pay.details.split("|").map((p) => p.trim())
                  : [pay.details];
                return (
                  <div key={pay.id} className="space-y-1.5 border-b border-zinc-200/50 pb-2 last:border-0 last:pb-0">
                    <p className="font-bold text-black uppercase text-[10px] tracking-tight">{pay.name}</p>
                    <div className="pl-2.5 space-y-1 border-l-2 border-zinc-200">
                      {parts.map((part, idx) => {
                        const colonIndex = part.indexOf(":");
                        if (colonIndex > -1) {
                          const key = part.slice(0, colonIndex).trim();
                          const val = part.slice(colonIndex + 1).trim();
                          return (
                            <div key={idx} className="flex text-[11px] font-sans">
                              <span className="text-zinc-400 font-semibold w-24 shrink-0 uppercase text-[9px] mt-[1.5px]">{key}:</span>
                              <span className="text-zinc-700 font-medium">{val}</span>
                            </div>
                          );
                        }
                        return (
                          <p key={idx} className="text-zinc-700 text-[11px] font-sans leading-tight">{part}</p>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {activeSettlements.length === 0 && (
                <p className="text-zinc-400 italic font-sans">Contact supplier directly to coordinate payment execution routes.</p>
              )}
            </div>
          </div>

          <div className="md:col-span-6 border border-black bg-white p-4 space-y-2 ml-auto w-full max-w-sm">
            <div className="flex justify-between text-zinc-500">
              <span>Gross Sub-Total:</span>
              <span className="font-bold text-black">{formatCurrency(doc.subTotal, shop.currency)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>Statutory VAT Levy:</span>
              <span className="font-bold text-black">{formatCurrency(doc.taxAmount, shop.currency)}</span>
            </div>
            <div className="flex justify-between text-black font-bold text-sm pt-2 border-t-2 border-black">
              <span>TOTAL OUTSTANDING:</span>
              <span className="underline underline-offset-2 decoration-double">{formatCurrency(doc.grandTotal, shop.currency)}</span>
            </div>

            {doc.kraCuInvoiceNumber && (
              <div className="border-t border-zinc-200 pt-4 mt-4 flex flex-col items-center gap-2">
                <span className="text-[9px] text-zinc-400 font-bold uppercase">KRA eTIMS VERIFICATION QR</span>
                <div className="bg-white p-2 border border-black flex justify-center items-center">
                  <QRCode
                    value={`https://etims.kra.go.ke/query/invoice/verify?invoiceNo=${doc.kraCuInvoiceNumber}`}
                    size={100}
                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                  />
                </div>
                <span className="text-[8px] text-zinc-400 font-sans text-center leading-tight">
                  Scan to verify this statutory tax document on the official KRA portal.
                </span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}