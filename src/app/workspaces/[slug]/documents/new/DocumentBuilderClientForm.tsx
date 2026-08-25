// src/app/workspaces/[slug]/documents/new/DocumentBuilderClientForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { calculateLineItem, calculateDocumentTotals, formatCurrency } from "@/lib/utils";
import { createBillingDocument, updateBillingDocument, DocumentType } from "@/lib/actions/documents";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

interface BuilderProps {
  shop: any;
  shopSlug: string;
  clients: any[];
  suppliers?: any[];
  products: any[];
  initialDocument?: any;
}

interface UiRowItem {
  productId?: string;
  description: string;
  notes?: string;
  quantity: number | "";
  unitPrice: number | "";
  taxType: "V_16" | "V_0" | "EXEMPT";
}

export function DocumentBuilderClientForm({ shop, shopSlug, clients, suppliers = [], products, initialDocument }: BuilderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialClientId = searchParams.get("clientId") || (initialDocument?.clientId) || "";
  const initialSupplierId = searchParams.get("supplierId") || (initialDocument?.supplierId) || "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Parameters
  const [partyType, setPartyType] = useState<"CLIENT" | "SUPPLIER">(
    initialSupplierId ? "SUPPLIER" : "CLIENT"
  );
  const [targetId, setTargetId] = useState(
    initialSupplierId || initialClientId || ""
  );
  const [docType, setDocType] = useState<DocumentType>(
    initialDocument?.type || (initialSupplierId ? "LPO" : "INVOICE")
  );
  const [dueDate, setDueDate] = useState(
    initialDocument?.dueDate ? new Date(initialDocument.dueDate).toISOString().split('T')[0] : ""
  );
  const [kraCuInvoiceNumber, setKraCuInvoiceNumber] = useState(initialDocument?.kraCuInvoiceNumber || "");
  const [requiresEtims, setRequiresEtims] = useState(initialDocument?.requiresEtims || false);
  const [currency, setCurrency] = useState(initialDocument?.currency || shop.currency || "KES");
  const [isRecurring, setIsRecurring] = useState(initialDocument?.isRecurring || false);
  const [recurringInterval, setRecurringInterval] = useState<"WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY">(
    initialDocument?.recurringInterval || "MONTHLY"
  );

  // Automatically switch partyType when selecting Procurement documents (LPO, PO, GRN, PV)
  useEffect(() => {
    if (docType === "LPO" || docType === "PO" || docType === "GOODS_RECEIVED_NOTE" || docType === "PAYMENT_VOUCHER") {
      if (partyType !== "SUPPLIER") {
        setPartyType("SUPPLIER");
        if (!initialSupplierId) setTargetId("");
      }
    }
  }, [docType, partyType, initialSupplierId]);

  // Update eTIMS preference when selecting target client or supplier
  useEffect(() => {
    if (targetId) {
      const list = partyType === "CLIENT" ? clients : suppliers;
      const selected = list.find((p) => p.id === targetId);
      if (selected && selected.requiresEtims) {
        setRequiresEtims(true);
      }
    }
  }, [targetId, partyType, clients, suppliers]);

  // Dynamic Ledger Item Rows
  const [rows, setRows] = useState<UiRowItem[]>(
    initialDocument?.items
      ? initialDocument.items.map((item: any) => ({
          productId: item.productId || undefined,
          description: item.description,
          notes: item.notes || "",
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          taxType: item.taxType,
        }))
      : [{ description: "", notes: "", quantity: 1, unitPrice: 0, taxType: "V_16" }]
  );

  // Document Summary Calculations computed reactively
  const normalizedRows = rows.map(r => ({
    ...r,
    quantity: typeof r.quantity === "number" ? r.quantity : 0,
    unitPrice: typeof r.unitPrice === "number" ? r.unitPrice : 0,
  }));

  const totals = calculateDocumentTotals({
    items: normalizedRows,
    isShopVatRegistered: shop.isVatRegistered,
  });

  function addBlankRow() {
    setRows([...rows, { description: "", notes: "", quantity: 1, unitPrice: 0, taxType: "V_16" }]);
  }

  function removeRow(index: number) {
    if (rows.length === 1) return;
    setRows(rows.filter((_, i) => i !== index));
  }

  function updateRowField(index: number, field: keyof UiRowItem, value: any) {
    const updated = [...rows];
    updated[index] = { ...updated[index], [field]: value };
    setRows(updated);
  }

  function handleProductLookup(index: number, productId: string) {
    const matchedProduct = products.find((p) => p.id === productId);
    if (!matchedProduct) return;

    const updated = [...rows];
    updated[index] = {
      productId: matchedProduct.id,
      description: matchedProduct.name,
      notes: updated[index].notes || "",
      quantity: 1,
      unitPrice: parseFloat(matchedProduct.unitPrice),
      taxType: matchedProduct.defaultTaxType,
    };
    setRows(updated);
  }

  function setQuickDueDate(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setDueDate(d.toISOString().split("T")[0]);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!targetId && partyType === "SUPPLIER") {
      const msg = "A targeted Supplier Profile must be selected for procurement documents.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const missingDescriptions = rows.some(r => !r.description.trim());
    if (missingDescriptions) {
      const msg = "All line item entries must have descriptions.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      initialDocument
        ? `Updating ${docType.toLowerCase()}...`
        : `Generating ${docType.toLowerCase()}...`
    );

    const itemsPayload = rows.map(r => ({
      productId: r.productId,
      description: r.description,
      notes: r.notes || undefined,
      quantity: typeof r.quantity === "number" ? r.quantity : 1,
      unitPrice: typeof r.unitPrice === "number" ? r.unitPrice : 0,
      taxType: r.taxType,
    }));

    const res = initialDocument
      ? await updateBillingDocument({
          documentId: initialDocument.id,
          shopId: shop.id,
          shopSlug,
          clientId: partyType === "CLIENT" ? targetId : undefined,
          supplierId: partyType === "SUPPLIER" ? targetId : undefined,
          type: docType,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          kraCuInvoiceNumber: kraCuInvoiceNumber.trim() || undefined,
          requiresEtims,
          currency,
          items: itemsPayload,
        })
      : await createBillingDocument({
          shopId: shop.id,
          shopSlug,
          clientId: partyType === "CLIENT" ? targetId : undefined,
          supplierId: partyType === "SUPPLIER" ? targetId : undefined,
          type: docType,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          kraCuInvoiceNumber: kraCuInvoiceNumber.trim() || undefined,
          requiresEtims,
          currency,
          isRecurring,
          recurringInterval: isRecurring ? recurringInterval : undefined,
          items: itemsPayload,
        });

    setLoading(false);
    if (!res.success) {
      const msg = res.error || "Failed to commit billing transaction.";
      setError(msg);
      toast.error(msg, { id: toastId });
    } else {
      toast.success(
        initialDocument
          ? `${docType} updated successfully!`
          : `${docType} created successfully!`,
        { id: toastId }
      );
      router.push(`/workspaces/${shop.slug}/documents/${initialDocument ? initialDocument.id : (res as any).documentId}`);
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8 font-mono text-xs selection:bg-black selection:text-white">
      {error && (
        <div className="border border-rose-300 bg-rose-50 p-4 text-rose-900 font-semibold uppercase rounded-md flex items-center gap-2">
          <span>❌ COMPILER_HALT:</span>
          <span>{error}</span>
        </div>
      )}

      {/* HEADER METADATA & CONFIGURATION CARD */}
      <div className="bg-white border border-zinc-200/80 rounded-lg p-6 shadow-sm space-y-6">
        <div className="border-b border-zinc-100 pb-3 flex justify-between items-center">
          <h2 className="font-sans text-sm font-bold uppercase tracking-tight text-black">
            1. Document Header &amp; Entity Configuration
          </h2>
          <span className="text-[10px] text-zinc-400 font-sans font-bold uppercase tracking-wider">Properties</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* TARGET ENTITY SELECTOR */}
          <div className="flex flex-col justify-end">
            <div className="h-7 flex items-end justify-between mb-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">Target Entity</label>
              <div className="flex bg-zinc-100 p-0.5 rounded border border-zinc-200 text-[9px]">
                <button
                  type="button"
                  onClick={() => { setPartyType("CLIENT"); setTargetId(""); }}
                  className={`px-2 py-0.5 font-semibold uppercase rounded transition-colors ${partyType === "CLIENT" ? "bg-black text-white shadow-sm" : "text-zinc-600 hover:text-black"}`}
                >
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => { setPartyType("SUPPLIER"); setTargetId(""); }}
                  className={`px-2 py-0.5 font-semibold uppercase rounded transition-colors ${partyType === "SUPPLIER" ? "bg-black text-white shadow-sm" : "text-zinc-600 hover:text-black"}`}
                >
                  Supplier
                </button>
              </div>
            </div>

            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-sans text-xs font-semibold h-10"
            >
              <option value="">
                {partyType === "CLIENT" ? "-- Walk-in / Over the Counter (No Client Record) --" : "-- Select Supplier Profile --"}
              </option>
              {partyType === "CLIENT"
                ? clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name.toUpperCase()} {c.taxPin ? `(PIN: ${c.taxPin})` : ""} {c.requiresEtims ? "[eTIMS]" : ""}
                    </option>
                  ))
                : suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name.toUpperCase()} {s.taxPin ? `(PIN: ${s.taxPin})` : ""} {s.requiresEtims ? "[eTIMS]" : ""}
                    </option>
                  ))
              }
            </select>
          </div>

          {/* DOCUMENT TYPE SELECTOR */}
          <div className="flex flex-col justify-end">
            <div className="h-7 flex items-end justify-between mb-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">Document Type</label>
            </div>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as DocumentType)}
              className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-xs font-bold uppercase h-10"
            >
              <option value="INVOICE">INV — Customer Invoice</option>
              <option value="RECEIPT">RCT — Official Receipt</option>
              <option value="QUOTATION">QT — Quotation / Estimate</option>
              <option value="LPO">LPO — Local Purchase Order</option>
              <option value="PO">PO — Purchase Order</option>
              <option value="DELIVERY_NOTE">DN — Delivery Note</option>
              <option value="CREDIT_NOTE">CN — Credit Note</option>
              <option value="DEBIT_NOTE">DBN — Debit Note</option>
              <option value="GOODS_RECEIVED_NOTE">GRN — Goods Received Note</option>
              <option value="PAYMENT_VOUCHER">PV — Payment Voucher</option>
            </select>
          </div>

          {/* KRA eTIMS CU SERIAL NUMBER */}
          <div className="flex flex-col justify-end">
            <div className="h-7 flex items-end justify-between mb-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">KRA eTIMS CU Serial #</label>
              <span className="text-[9px] text-zinc-400 italic">Optional</span>
            </div>
            <input
              type="text"
              value={kraCuInvoiceNumber}
              onChange={(e) => setKraCuInvoiceNumber(e.target.value)}
              placeholder="e.g. CU0123456789/2026"
              className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-xs uppercase h-10"
            />
          </div>

          {/* PAYMENT DUE DATE */}
          <div className="flex flex-col justify-end">
            <div className="h-7 flex items-end justify-between mb-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">Payment Due Date</label>
              <div className="flex gap-1 text-[9px]">
                <button
                  type="button"
                  onClick={() => setQuickDueDate(7)}
                  className="px-1.5 py-0.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-zinc-600 font-semibold"
                >
                  +7d
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDueDate(14)}
                  className="px-1.5 py-0.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-zinc-600 font-semibold"
                >
                  +14d
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDueDate(30)}
                  className="px-1.5 py-0.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-zinc-600 font-semibold"
                >
                  +30d
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black text-xs font-semibold h-10"
            />
          </div>

        </div>
      </div>

      {/* LINE ITEMS MATRIX */}
      <div className="bg-white border border-zinc-200/80 rounded-lg shadow-sm overflow-hidden space-y-0">
        <div className="bg-zinc-50 border-b border-zinc-200 px-6 py-3.5 flex justify-between items-center">
          <h2 className="font-sans text-sm font-bold uppercase tracking-tight text-black">
            2. Line Item Execution Ledger
          </h2>
          <span className="text-[10px] text-zinc-500 font-semibold font-mono">
            {rows.length} {rows.length === 1 ? "Line Item" : "Line Items"} Registered
          </span>
        </div>
        
        <div className="divide-y divide-zinc-100">
          {rows.map((row, index) => {
            const calculatedRow = calculateLineItem({
              quantity: typeof row.quantity === "number" ? row.quantity : 0,
              unitPrice: typeof row.unitPrice === "number" ? row.unitPrice : 0,
              taxType: row.taxType,
              isShopVatRegistered: shop.isVatRegistered
            });

            // Find matched product if linked
            const matchedCatalogProduct = products.find(p => p.id === row.productId);
            const rowQty = typeof row.quantity === "number" ? row.quantity : 0;
            const isOverstock = matchedCatalogProduct && matchedCatalogProduct.trackStock && rowQty > parseFloat(matchedCatalogProduct.stockQuantity || "0");

            return (
              <div key={index} className="p-6 space-y-4 hover:bg-zinc-50/50 transition-colors">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  
                  {/* CATALOG LOOKUP & DESCRIPTION */}
                  <div className="lg:col-span-5 space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase block font-semibold">Catalog Product / Service Lookup</label>
                      <select
                        onChange={(e) => handleProductLookup(index, e.target.value)}
                        value={row.productId || ""}
                        className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-md font-sans text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black"
                      >
                        <option value="">-- SELECT FROM CATALOG REGISTER (OPTIONAL) --</option>
                        {products.map((p) => {
                          const stockVal = parseFloat(p.stockQuantity || "0");
                          const stockLabel = p.trackStock ? ` (${stockVal > 0 ? `${stockVal} in stock` : "OUT OF STOCK"})` : "";
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} — {formatCurrency(parseFloat(p.unitPrice), shop.currency)}{stockLabel}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 font-semibold uppercase block">Billing Description / Core Deliverable *</label>
                      <input
                        type="text"
                        value={row.description}
                        placeholder="Item description or billing specification..."
                        onChange={(e) => updateRowField(index, "description", e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-md font-sans text-xs focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                        required
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-400 font-semibold uppercase block">Specific Details / Sub-Notes (Optional)</label>
                      <input
                        type="text"
                        value={row.notes || ""}
                        placeholder="e.g., harddisk repair, specific serial number..."
                        onChange={(e) => updateRowField(index, "notes", e.target.value)}
                        className="w-full px-3 py-2 border border-zinc-200 bg-zinc-50 placeholder:text-zinc-400 rounded-md font-sans text-xs focus:outline-none focus:ring-1 focus:ring-black italic text-zinc-600"
                      />
                    </div>

                    {isOverstock && (
                      <div className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
                        ⚠️ Quantity ({row.quantity}) exceeds current stock ({parseFloat(matchedCatalogProduct.stockQuantity)} available)
                      </div>
                    )}
                  </div>

                  {/* QUANTITY */}
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase block font-semibold">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={row.quantity}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateRowField(index, "quantity", val === "" ? "" : (parseFloat(val) || 0));
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-md font-semibold text-center text-xs focus:outline-none focus:ring-1 focus:ring-black"
                      required
                    />
                  </div>

                  {/* UNIT PRICE */}
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase block font-semibold">Unit Price ({currency})</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={row.unitPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateRowField(index, "unitPrice", val === "" ? "" : (parseFloat(val) || 0));
                      }}
                      className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-md font-semibold text-xs focus:outline-none focus:ring-1 focus:ring-black"
                      required
                    />
                  </div>

                  {/* TAX TYPE */}
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase block font-semibold">Tax Rule</label>
                    <select
                      value={row.taxType}
                      onChange={(e) => updateRowField(index, "taxType", e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-md text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="V_16">16% VAT Standard</option>
                      <option value="V_0">0% VAT (Zero-Rated)</option>
                      <option value="EXEMPT">Exempt</option>
                    </select>
                  </div>

                  {/* ROW TOTAL & DELETE */}
                  <div className="lg:col-span-1 space-y-2 flex flex-col justify-between items-end h-full">
                    <div className="w-full text-right">
                      <span className="text-[9px] text-zinc-400 block font-mono font-semibold uppercase">Row Total</span>
                      <span className="font-sans text-xs font-bold text-black block mt-1">
                        {formatCurrency(calculatedRow.itemTotal, currency)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeRow(index)}
                      disabled={rows.length === 1}
                      className="text-rose-600 hover:text-rose-900 border border-rose-200 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 text-[10px] font-semibold uppercase rounded disabled:opacity-20 transition-colors w-full mt-2"
                    >
                      Delete
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

        {/* BILLING & AUTOMATION CONFIGURATION */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-zinc-100">
          <div className="flex flex-col justify-end">
            <label className="text-[10px] text-zinc-400 uppercase font-semibold mb-1.5">Document Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-sans text-xs font-semibold h-10"
            >
              {["KES", "USD", "EUR", "GBP", "UGX", "TZS", "ZAR", "RWF"].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col justify-end">
            <label className="text-[10px] text-zinc-400 uppercase font-semibold mb-1.5 flex items-center justify-between">
               Recurring Automation
            </label>
            <div className="flex items-center h-10 border border-zinc-300 rounded-md px-3 bg-white hover:border-black transition-colors">
              <label className="flex items-center gap-2 cursor-pointer w-full text-xs font-semibold">
                <input 
                  type="checkbox" 
                  checked={isRecurring} 
                  onChange={(e) => setIsRecurring(e.target.checked)}
                  className="accent-black w-4 h-4 cursor-pointer"
                />
                Make this a Recurring {docType === "INVOICE" || docType === "RECEIPT" ? docType.toLowerCase() : "document"}
              </label>
            </div>
          </div>

          {isRecurring && (
             <div className="flex flex-col justify-end">
               <label className="text-[10px] text-zinc-400 uppercase font-semibold mb-1.5">Billing Interval</label>
               <select
                 value={recurringInterval}
                 onChange={(e) => setRecurringInterval(e.target.value as any)}
                 className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-sans text-xs font-semibold h-10"
               >
                 <option value="WEEKLY">Weekly</option>
                 <option value="MONTHLY">Monthly</option>
                 <option value="QUARTERLY">Quarterly</option>
                 <option value="YEARLY">Yearly</option>
               </select>
             </div>
          )}
        </div>
        

        {/* ADD ROW BUTTON */}
        <div className="p-4 border-t border-zinc-200/80 bg-zinc-50 flex justify-between items-center">
          <button
            type="button"
            onClick={addBlankRow}
            className="btn-secondary-modern text-xs font-semibold px-4 py-2 uppercase tracking-wide flex items-center gap-2"
          >
            <span>+ Add Line Item Entry</span>
          </button>

          <span className="text-[10px] text-zinc-400 font-mono">
            Sub-total calculates in real-time
          </span>
        </div>
      </div>

      {/* FINANCIAL AGGREGATIONS & SUBMISSION SUMMARY CARD */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <div className="lg:col-span-7 bg-zinc-50 border border-zinc-200/80 rounded-lg p-6 space-y-4 font-sans">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-black" />
            <h3 className="font-bold text-xs uppercase tracking-tight text-black">Compliance &amp; System Notes</h3>
          </div>
          <p className="text-zinc-500 text-xs leading-relaxed font-mono text-[11px]">
            &gt; Fiscal Verification Engine: Transactions are stored cleanly with frozen precision metrics. Draft documents can be updated or finalized at any time.
          </p>
          {requiresEtims && (
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-[11px] font-semibold text-emerald-900 flex items-center gap-2">
              <span>✓ Target entity requires eTIMS fiscal signing.</span>
            </div>
          )}
        </div>
        
        <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-lg p-6 shadow-sm space-y-4 font-mono">
          <h3 className="font-sans text-xs font-bold uppercase tracking-tight text-black border-b border-zinc-100 pb-2">
            3. Financial Summary
          </h3>

          <div className="space-y-2 text-xs">
            <div className="bg-white rounded p-4 border border-zinc-200/80 shadow-sm space-y-3 font-mono">
              <div className="flex justify-between text-zinc-600 text-[10px] font-semibold">
                <span>SUB-TOTAL ({currency}):</span>
                <span className="text-black">{formatCurrency(totals.subTotal, currency)}</span>
              </div>
              <div className="flex justify-between text-zinc-600 text-[10px] font-semibold">
                <span>VAT / TAX ({currency}):</span>
                <span className="text-black">{formatCurrency(totals.taxAmount, currency)}</span>
              </div>
              <div className="flex justify-between font-bold text-black border-t border-zinc-200 pt-3 text-sm">
                <span>GRAND TOTAL:</span>
                <span>{formatCurrency(totals.grandTotal, currency)}</span>
              </div>
            </div>
          </div>
          
          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern w-full py-3.5 font-bold uppercase tracking-wider text-xs shadow-md disabled:bg-zinc-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner size={14} />
                  <span>COMMITTING TRANSACTION...</span>
                </span>
              ) : (
                `✓ ISSUE ${docType} NOW`
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}