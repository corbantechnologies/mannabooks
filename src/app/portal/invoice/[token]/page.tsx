// src/app/portal/invoice/[token]/page.tsx
import { db } from "@/db";
import { documentTokens, documents, shops, paymentMethods } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import crypto from "crypto";

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

  // 2. Query full document with client, shop, and line items
  const doc = await db.query.documents.findFirst({
    where: eq(documents.id, targetDocumentId),
    with: {
      client: true,
      shop: true,
      items: true,
    },
  });

  if (!doc) {
    notFound();
  }

  const shop = doc.shop;
  const client = doc.client;

  // 2. Fetch the active shop payment instructions to show settlement channels
  const activeSettlements = await db.query.paymentMethods.findMany({
    where: eq(paymentMethods.shopId, shop.id),
  });

  return (
    <div className="min-h-screen bg-zinc-50 py-12 px-4 sm:px-6 font-mono text-xs text-black selection:bg-black selection:text-white">
      <div className="max-w-3xl mx-auto bg-white border border-black p-6 sm:p-12 space-y-12 shadow-sm">
        
        {/* PUBLIC PORTAL BRAND HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start gap-6 border-b border-black pb-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold uppercase tracking-tighter font-sans">{shop.name}</h1>
            {shop.taxPin && <p className="text-[11px] text-zinc-500">VAT PIN: {shop.taxPin}</p>}
            <p className="text-zinc-500 font-sans italic lowercase">Origin: Secure Ledger Channel</p>
          </div>
          
          <div className="text-left sm:text-right space-y-1">
            <div className="inline-block border border-black px-2 py-0.5 font-bold uppercase tracking-wider bg-zinc-50 text-[10px]">
              {doc.type} SNAPSHOT
            </div>
            <p className="text-base font-bold text-black mt-1">{doc.docNumber}</p>
            <p className="text-zinc-500">Issued: {new Date(doc.issueDate).toLocaleDateString()}</p>
            {doc.dueDate && <p className="text-rose-600 font-bold">Maturity: {new Date(doc.dueDate).toLocaleDateString()}</p>}
          </div>
        </div>

        {/* METADATA CLIENT ROUTING PARTICULARS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 border-b border-black pb-8">
          <div className="space-y-1">
            <span className="text-zinc-400 uppercase text-[10px] block">Billing Destination:</span>
            <p className="font-sans text-sm font-bold uppercase text-black">{client.name}</p>
            <p className="font-sans text-zinc-600">{client.email}</p>
            {client.phone && <p className="text-zinc-600">{client.phone}</p>}
            {client.taxPin && <p className="text-black font-bold">Tax PIN: {client.taxPin}</p>}
          </div>
          
          <div className="space-y-2 sm:text-right">
            <span className="text-zinc-400 uppercase text-[10px] block">Current Status:</span>
            <span className={`inline-block border px-3 py-1 font-bold text-xs uppercase tracking-widest ${
              doc.status === "PAID" ? "bg-black text-white border-black" : "bg-white text-rose-600 border-rose-600 border-dashed"
            }`}>
              {doc.status}
            </span>
            <div className="pt-2">
              <a 
                href={`/portal/pdf/${token}`}
                className="inline-block border border-black px-4 py-1.5 text-[10px] font-bold uppercase hover:bg-zinc-50 transition-colors"
              >
                ↓ Download Vector PDF
              </a>
            </div>
          </div>
        </div>

        {/* EXPLICIT TRANSACTION LINE ITEM MATRIX */}
        <div className="space-y-2">
          <span className="text-zinc-400 uppercase text-[10px] block">Itemization Sub-Ledger:</span>
          <div className="border border-black overflow-hidden">
            <div className="grid grid-cols-12 bg-zinc-50 border-b border-black p-3 font-bold uppercase text-[10px] tracking-tight">
              <div className="col-span-6">Description / Core Deliverable</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Unit Rate</div>
              <div className="col-span-2 text-right">Line Total</div>
            </div>
            
            <div className="divide-y divide-zinc-200 bg-white">
              {doc.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 p-3 items-center font-sans text-xs">
                  <div className="col-span-6 font-bold text-black uppercase tracking-tight">{item.description}</div>
                  <div className="col-span-2 text-center font-mono text-xs">{item.quantity}</div>
                  <div className="col-span-2 text-right font-mono text-xs">{formatCurrency(item.unitPrice, shop.currency)}</div>
                  <div className="col-span-2 text-right font-mono text-xs font-bold text-black">{formatCurrency(item.itemTotal, shop.currency)}</div>
                </div>
              ))}
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
              {activeSettlements.map((pay) => (
                <div key={pay.id} className="space-y-0.5">
                  <p className="font-bold text-black uppercase text-[11px]">{pay.name}</p>
                  <p className="text-zinc-600 text-xs font-sans whitespace-pre-line leading-tight">{pay.details}</p>
                </div>
              ))}
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
          </div>
        </div>

      </div>
    </div>
  );
}