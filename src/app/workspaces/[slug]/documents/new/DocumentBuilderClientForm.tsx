// src/app/workspaces/[slug]/documents/new/DocumentBuilderClientForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { calculateLineItem, calculateDocumentTotals, formatCurrency, isFiscalDocType, isProcurementDocType } from "@/lib/utils";
import { createBillingDocument, updateBillingDocument, DocumentType } from "@/lib/actions/documents";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";
import { CatalogProductPicker, CatalogProductItem } from "@/components/CatalogProductPicker";
import { PartyPicker } from "@/components/PartyPicker";

interface BuilderProps {
  shop: any;
  shopSlug: string;
  clients: any[];
  suppliers?: any[];
  products: any[];
  shopTerms?: any[];
  currencies?: any[];
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

export function DocumentBuilderClientForm({ shop, shopSlug, clients, suppliers = [], products, shopTerms = [], currencies = [], initialDocument }: BuilderProps) {
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
  const [exchangeRate, setExchangeRate] = useState<string>(() => {
    if (initialDocument?.exchangeRate) return String(initialDocument.exchangeRate);
    const initialCurr = initialDocument?.currency || shop.currency || "KES";
    if (initialCurr === (shop.currency || "KES")) return "1.0000";
    const matched = currencies.find((c: any) => c.code === initialCurr);
    return matched ? parseFloat(matched.exchangeRate).toFixed(4) : "1.0000";
  });
  const [isFetchingGuidanceRate, setIsFetchingGuidanceRate] = useState(false);
  const [isRecurring, setIsRecurring] = useState(initialDocument?.isRecurring || false);
  const [recurringInterval, setRecurringInterval] = useState<"WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY">(
    initialDocument?.recurringInterval || "MONTHLY"
  );

  function handleCurrencyChange(newCurr: string) {
    setCurrency(newCurr);
    const base = shop.currency || "KES";
    if (newCurr === base) {
      setExchangeRate("1.0000");
      return;
    }
    const matched = currencies.find((c: any) => c.code === newCurr && c.isEnabled);
    if (matched) {
      setExchangeRate(parseFloat(matched.exchangeRate).toFixed(4));
    } else {
      fetchLiveGuidanceRate(newCurr, base);
    }
  }

  async function fetchLiveGuidanceRate(fromCurr: string, toCurr: string) {
    setIsFetchingGuidanceRate(true);
    try {
      const res = await fetch(`/api/exchange-rate?from=${fromCurr}&to=${toCurr}`);
      const data = await res.json();
      if (data.success && typeof data.rate === "number") {
        setExchangeRate(data.rate.toFixed(4));
        toast.success(`Guidance rate: 1 ${fromCurr} = ${data.rate.toFixed(4)} ${toCurr}`);
      }
    } catch {
      toast.error("Could not fetch live rate. Please enter manually.");
    } finally {
      setIsFetchingGuidanceRate(false);
    }
  }

  // Commercial Terms & Conditions state
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>(() => {
    if (initialDocument?.termsAndConditions) {
      try {
        const parsed = JSON.parse(initialDocument.termsAndConditions);
        if (Array.isArray(parsed)) {
          return shopTerms.filter(t => parsed.some((p: string) => p.includes(t.title))).map(t => t.id);
        }
      } catch {}
    }
    return shopTerms
      .filter(t => (initialDocument?.type || docType) === "QUOTATION" ? t.isDefaultCatalog : t.isDefaultInvoice)
      .map(t => t.id);
  });
  const [customTermsText, setCustomTermsText] = useState<string>(() => {
    if (initialDocument?.termsAndConditions) {
      try {
        const parsed = JSON.parse(initialDocument.termsAndConditions);
        if (Array.isArray(parsed)) {
          const knownTitles = shopTerms.map(t => t.title);
          const customOnes = parsed.filter((p: string) => !knownTitles.some(k => p.startsWith(k)));
          return customOnes.join("\n");
        }
        return initialDocument.termsAndConditions;
      } catch {
        return initialDocument.termsAndConditions;
      }
    }
    return "";
  });

  // Automatically switch partyType when selecting Procurement documents (LPO, PO, GRN, PV)
  useEffect(() => {
    if (docType === "LPO" || docType === "PO" || docType === "GOODS_RECEIVED_NOTE" || docType === "PAYMENT_VOUCHER") {
      if (partyType !== "SUPPLIER") {
        setPartyType("SUPPLIER");
        if (!initialSupplierId) setTargetId("");
      }
    }
  }, [docType, partyType, initialSupplierId]);

  // Update eTIMS preference when selecting target client or supplier (only for fiscal documents)
  useEffect(() => {
    if (targetId) {
      const list = partyType === "CLIENT" ? clients : suppliers;
      const selected = list.find((p) => p.id === targetId);
      if (selected && selected.requiresEtims && isFiscalDocType(docType)) {
        setRequiresEtims(true);
      }
    }
  }, [targetId, partyType, clients, suppliers, docType]);

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

  function handleProductSelect(index: number, product: CatalogProductItem | null) {
    const updated = [...rows];
    if (!product) {
      updated[index] = {
        ...updated[index],
        productId: undefined,
      };
      setRows(updated);
      return;
    }

    const isProcurement = isProcurementDocType(docType) || partyType === "SUPPLIER";
    const costVal = product.costPrice ? parseFloat(product.costPrice) : 0;
    const sellVal = parseFloat(product.unitPrice);
    const defaultPrice = isProcurement
      ? (costVal > 0 ? costVal : sellVal)
      : sellVal;

    updated[index] = {
      productId: product.id,
      description: product.name,
      notes: updated[index].notes || "",
      quantity: updated[index].quantity || 1,
      unitPrice: defaultPrice,
      taxType: product.defaultTaxType,
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

    const combinedTerms: string[] = [];
    for (const termId of selectedTermIds) {
      const found = shopTerms.find((t: any) => t.id === termId);
      if (found) {
        combinedTerms.push(`${found.title}: ${found.content}`);
      }
    }
    if (customTermsText.trim()) {
      combinedTerms.push(customTermsText.trim());
    }
    const finalTermsSerialized = combinedTerms.length > 0 ? JSON.stringify(combinedTerms) : undefined;

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
          requiresEtims: isFiscalDocType(docType) ? requiresEtims : false,
          currency,
          exchangeRate: parseFloat(exchangeRate) || 1.0,
          termsAndConditions: finalTermsSerialized,
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
          requiresEtims: isFiscalDocType(docType) ? requiresEtims : false,
          currency,
          exchangeRate: parseFloat(exchangeRate) || 1.0,
          isRecurring,
          recurringInterval: isRecurring ? recurringInterval : undefined,
          termsAndConditions: finalTermsSerialized,
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

            <PartyPicker
              partyType={partyType}
              parties={partyType === "CLIENT" ? clients : suppliers}
              selectedId={targetId}
              onSelect={(id) => setTargetId(id)}
              onPartyTypeChange={(type) => {
                setPartyType(type);
                setTargetId("");
              }}
            />
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
              <span className="text-[9px] text-zinc-400 italic">
                {isFiscalDocType(docType) ? "Optional" : "N/A for Non-Fiscal"}
              </span>
            </div>
            <input
              type="text"
              value={kraCuInvoiceNumber}
              onChange={(e) => setKraCuInvoiceNumber(e.target.value)}
              disabled={!isFiscalDocType(docType)}
              placeholder={isFiscalDocType(docType) ? "e.g. CU0123456789/2026" : "Not applicable"}
              className={`w-full px-3 py-2.5 border rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-xs uppercase h-10 ${
                isFiscalDocType(docType) ? "border-zinc-300 bg-white" : "border-zinc-200 bg-zinc-100 text-zinc-400 cursor-not-allowed"
              }`}
            />
          </div>

          {/* PAYMENT DUE DATE / QUOTATION EXPIRY DATE */}
          <div className="flex flex-col justify-end">
            <div className="h-7 flex items-end justify-between mb-1.5">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">
                {docType === "QUOTATION" ? "Quotation Expiry Date" : "Payment Due Date"}
              </label>
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
                <button
                  type="button"
                  onClick={() => setQuickDueDate(60)}
                  className="px-1.5 py-0.5 border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 rounded text-zinc-600 font-semibold"
                >
                  +60d
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

        {/* ROW 2: MULTI-CURRENCY CONFIGURATION & RECURRING SCHEDULE */}
        <div className="border-t border-zinc-100 pt-5 grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          
          {/* CURRENCY SELECTOR */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold">
                Billing Currency
              </label>
              <Link
                href={`/workspaces/${shopSlug}/settings/currencies`}
                className="text-[9px] text-zinc-400 hover:text-black font-sans uppercase underline"
              >
                ⚙ Manage Rates
              </Link>
            </div>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-xs font-bold uppercase h-10"
            >
              <option value={shop.currency || "KES"}>
                {shop.currency || "KES"} — Base Workspace Currency
              </option>
              {currencies.filter((c: any) => c.code !== (shop.currency || "KES")).map((c: any) => (
                <option key={c.id || c.code} value={c.code}>
                  {c.code} ({c.symbol}) — {c.name} {c.exchangeRate ? `(Rate: ${parseFloat(c.exchangeRate).toFixed(2)})` : ""}
                </option>
              ))}
            </select>
          </div>

          {/* EXCHANGE RATE INPUT (IF FOREIGN CURRENCY) */}
          {currency !== (shop.currency || "KES") && (
            <div className="md:col-span-4 space-y-1.5 animate-in fade-in">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-zinc-500 uppercase font-bold">
                  Exchange Rate (1 {currency} = ? {shop.currency || "KES"})
                </label>
                <button
                  type="button"
                  disabled={isFetchingGuidanceRate}
                  onClick={() => fetchLiveGuidanceRate(currency, shop.currency || "KES")}
                  className="text-[9px] text-blue-600 hover:underline font-bold uppercase"
                >
                  {isFetchingGuidanceRate ? "Fetching..." : "⚡ Live Guidance"}
                </button>
              </div>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                required
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                placeholder="e.g. 129.50"
                className="w-full px-3 py-2 border border-amber-300 bg-amber-50/50 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-black font-mono text-xs font-bold h-10"
              />
            </div>
          )}

          {/* RECURRING INVOICE TOGGLE (FOR INVOICES) */}
          {docType === "INVOICE" && (
            <div className={`space-y-1.5 ${currency !== (shop.currency || "KES") ? "md:col-span-4" : "md:col-span-8"}`}>
              <label className="text-[10px] text-zinc-400 uppercase font-semibold block">
                Recurring Invoicing Series
              </label>
              <div className="flex items-center gap-3 h-10 border border-zinc-200 rounded-md px-3 bg-zinc-50/70">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isRecurring}
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="w-4 h-4 rounded text-black focus:ring-black border-zinc-300"
                  />
                  <span className="font-sans text-xs font-bold text-black">🔁 Make Recurring</span>
                </label>

                {isRecurring && (
                  <select
                    value={recurringInterval}
                    onChange={(e) => setRecurringInterval(e.target.value as any)}
                    className="ml-auto px-2 py-1 border border-zinc-300 bg-white rounded font-mono text-[10px] uppercase font-bold focus:outline-none focus:border-black"
                  >
                    <option value="WEEKLY">Every Week</option>
                    <option value="MONTHLY">Every Month</option>
                    <option value="QUARTERLY">Every Quarter</option>
                    <option value="YEARLY">Every Year</option>
                  </select>
                )}
              </div>
            </div>
          )}

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
                      <CatalogProductPicker
                        products={products}
                        selectedProductId={row.productId}
                        currency={currency}
                        isProcurement={isProcurementDocType(docType) || partyType === "SUPPLIER"}
                        onSelect={(product) => handleProductSelect(index, product)}
                      />
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

                    {/* CONTEXT-AWARE INVENTORY STATUS BADGE */}
                    {matchedCatalogProduct && matchedCatalogProduct.trackStock && (
                      isProcurementDocType(docType) || partyType === "SUPPLIER" ? (
                        <div className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded flex items-center gap-1.5 font-mono">
                          <span>📦</span>
                          <span>Inbound Restock: Current stock is {parseFloat(matchedCatalogProduct.stockQuantity || "0")} units ({rowQty > 0 ? `ordering +${rowQty}` : "enter qty"})</span>
                        </div>
                      ) : docType === "QUOTATION" ? (
                        <div className="text-[10px] font-semibold text-zinc-700 bg-zinc-50 border border-zinc-200 px-2.5 py-1.5 rounded flex items-center gap-1.5 font-mono">
                          <span>📦</span>
                          <span>Available Inventory: {parseFloat(matchedCatalogProduct.stockQuantity || "0")} units</span>
                        </div>
                      ) : isOverstock ? (
                        <div className="text-[10px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded font-mono">
                          ⚠️ Outbound quantity ({row.quantity}) exceeds available stock ({parseFloat(matchedCatalogProduct.stockQuantity || "0")} units)
                        </div>
                      ) : null
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

                  {/* UNIT PRICE / COST PRICE */}
                  <div className="lg:col-span-2 space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase block font-semibold">
                      {isProcurementDocType(docType) || partyType === "SUPPLIER" ? `Cost Price (${currency})` : `Unit Price (${currency})`}
                    </label>
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
        
        <div className="lg:col-span-7 space-y-6">
          {/* COMMERCIAL TERMS & CONDITIONS SELECTOR */}
          <div className="bg-white border border-zinc-200/80 rounded-lg p-5 shadow-sm space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                <h3 className="font-sans text-xs font-bold uppercase tracking-tight text-black">
                  Commercial Terms &amp; Conditions
                </h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-semibold uppercase">
                {selectedTermIds.length} Selected
              </span>
            </div>

            {/* SHOP TERMS CHECKLIST */}
            {shopTerms.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">Select terms to apply to this {docType.toLowerCase()}:</p>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {shopTerms.map((term: any) => {
                    const isChecked = selectedTermIds.includes(term.id);
                    return (
                      <label
                        key={term.id}
                        className={`flex items-start gap-2.5 p-2.5 border rounded cursor-pointer transition-colors ${
                          isChecked ? "border-black bg-zinc-50/80" : "border-zinc-200 bg-white hover:border-zinc-300"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTermIds([...selectedTermIds, term.id]);
                            } else {
                              setSelectedTermIds(selectedTermIds.filter(id => id !== term.id));
                            }
                          }}
                          className="w-4 h-4 accent-black rounded mt-0.5 cursor-pointer"
                        />
                        <div className="space-y-0.5 flex-1">
                          <span className="font-bold text-black uppercase text-[11px] block font-sans">{term.title}</span>
                          <span className="text-[10.5px] text-zinc-600 font-sans block leading-normal">{term.content}</span>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-3 border border-dashed border-zinc-200 rounded text-zinc-400 text-center font-sans text-xs">
                No shop terms library created yet. You can configure reusable presets in Settings or type custom terms below.
              </div>
            )}

            {/* CUSTOM DEAL / CLIENT OVERRIDE TEXTAREA */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-100">
              <label className="text-[10px] text-zinc-400 uppercase font-semibold block">
                + Custom Deal Terms / Special Client Adjustments (Optional)
              </label>
              <textarea
                value={customTermsText}
                onChange={(e) => setCustomTermsText(e.target.value)}
                placeholder="e.g., Special agreement: 30-day grace period or waiver of delivery fee for VIP account."
                className="w-full px-3 py-2 border border-zinc-300 bg-white rounded focus:outline-none focus:border-black text-xs font-sans h-16 resize-none"
              ></textarea>
            </div>
          </div>

          {/* COMPLIANCE NOTE */}
          <div className="bg-zinc-50 border border-zinc-200/80 rounded-lg p-5 space-y-3 font-sans">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-black" />
              <h3 className="font-bold text-xs uppercase tracking-tight text-black">Compliance &amp; System Notes</h3>
            </div>
            <p className="text-zinc-500 text-xs leading-relaxed font-sans">
              All transactions and calculations are saved accurately. Draft documents can be edited or finalized whenever you are ready.
            </p>
            {requiresEtims && (
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded text-xs font-semibold text-emerald-900 flex items-center gap-2 font-sans">
                <span>✓ Client requires eTIMS fiscal signing.</span>
              </div>
            )}
          </div>
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

              {currency !== (shop.currency || "KES") && (
                <div className="bg-amber-50 border border-amber-200 rounded p-2.5 space-y-1 text-[11px] font-sans text-amber-900 mt-2">
                  <div className="flex justify-between font-semibold">
                    <span>Base Equivalent ({shop.currency || "KES"}):</span>
                    <span className="font-bold">{formatCurrency(totals.grandTotal * (parseFloat(exchangeRate) || 1), shop.currency || "KES")}</span>
                  </div>
                  <p className="text-[9px] text-amber-700 font-mono">
                    Applied rate: 1 {currency} = {parseFloat(exchangeRate || "1").toFixed(4)} {shop.currency || "KES"}
                  </p>
                </div>
              )}
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