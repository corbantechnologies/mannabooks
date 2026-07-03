// src/app/workspaces/[slug]/documents/new/DocumentBuilderClientForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { calculateLineItem, calculateDocumentTotals, formatCurrency } from "@/lib/utils";
import { createBillingDocument } from "@/lib/actions/documents";
import { toast } from "react-hot-toast";

interface BuilderProps {
  shop: any;
  shopSlug: string;
  clients: any[];
  products: any[];
}

interface UiRowItem {
  description: string;
  quantity: number;
  unitPrice: number;
  taxType: "V_16" | "V_0" | "EXEMPT";
}

export function DocumentBuilderClientForm({ shop, shopSlug, clients, products }: BuilderProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Parameters
  const [clientId, setClientId] = useState("");
  const [docType, setDocType] = useState<"QUOTATION" | "INVOICE" | "RECEIPT">("INVOICE");
  const [dueDate, setDueDate] = useState("");
  
  // Dynamic Ledger Item Rows
  const [rows, setRows] = useState<UiRowItem[]>([
    { description: "", quantity: 1, unitPrice: 0, taxType: "V_16" }
  ]);

  // Document Summary Calculations computed reactively
  const totals = calculateDocumentTotals({
    items: rows,
    isShopVatRegistered: shop.isVatRegistered,
  });

  function addBlankRow() {
    setRows([...rows, { description: "", quantity: 1, unitPrice: 0, taxType: "V_16" }]);
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
      description: matchedProduct.name,
      quantity: 1,
      unitPrice: parseFloat(matchedProduct.unitPrice),
      taxType: matchedProduct.defaultTaxType,
    };
    setRows(updated);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!clientId) {
      const msg = "A targeted Client Profile must be explicitly mapped to this file.";
      setError(msg);
      toast.error(msg);
      return;
    }

    const missingDescriptions = rows.some(r => !r.description.trim());
    if (missingDescriptions) {
      const msg = "All ledger line entries must specify clear item descriptions.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    const toastId = toast.loading(`Generating ${docType.toLowerCase()}...`);

    const res = await createBillingDocument({
      shopId: shop.id,
      shopSlug,
      clientId,
      type: docType,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      items: rows,
    });

    setLoading(false);
    if (!res.success) {
      const msg = res.error || "Failed to commit billing transaction.";
      setError(msg);
      toast.error(msg, { id: toastId });
    } else {
      toast.success(`${docType} created successfully!`, { id: toastId });
      router.push(`/workspaces/${shop.slug}/documents`);
    }
  }

  return (
    <form onSubmit={handleFormSubmit} className="space-y-8 font-mono text-xs selection:bg-black selection:text-white">
      {error && (
        <div className="border border-black bg-zinc-50 p-4 text-black font-bold uppercase">
          &gt; COMPILER_HALT: {error}
        </div>
      )}

      {/* PARENT ATTRIBUTE META GRID */}
      <div className="border border-black p-6 grid grid-cols-1 md:grid-cols-3 gap-6 bg-white">
        <div className="space-y-1">
          <label className="text-zinc-400 uppercase block">Target Recipient Client</label>
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full px-3 py-2 border border-black bg-white rounded-none focus:outline-none focus:ring-1 focus:ring-black font-sans text-sm"
            required
          >
            <option value="">-- SELECT FROM CLIENT FLOW REGISTRY --</option>
            {clients.map(c => (
              <option key={c.id} value={c.id}>
                {c.name.toUpperCase()} {c.taxPin ? `(${c.taxPin})` : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 uppercase block">Document Target Node</label>
          <div className="grid grid-cols-3 border border-black divide-x divide-black bg-white">
            {(["INVOICE", "QUOTATION", "RECEIPT"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setDocType(type)}
                className={`py-2 font-bold uppercase text-[10px] rounded-none transition-colors ${
                  docType === type ? "bg-black text-white" : "bg-white text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-zinc-400 uppercase block">Expected Payment Maturity Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full px-3 py-2 border border-black bg-white rounded-none focus:outline-none focus:ring-1 focus:ring-black"
          />
        </div>
      </div>

      {/* DYNAMIC MULTI-ROW LEDGER MATRIX */}
      <div className="border border-black bg-white">
        <div className="bg-zinc-50 border-b border-black px-4 py-3 font-bold uppercase tracking-wider">
          Line Item Execution Ledger
        </div>
        
        <div className="divide-y divide-black bg-white">
          {rows.map((row, index) => {
            const calculatedRow = calculateLineItem({
              quantity: row.quantity,
              unitPrice: row.unitPrice,
              taxType: row.taxType,
              isShopVatRegistered: shop.isVatRegistered
            });

            return (
              <div key={index} className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end group">
                
                {/* Quick Catalog Selection Lookup menu */}
                <div className="lg:col-span-3 space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase block">Catalog Shortcut Look-up</label>
                  <select
                    onChange={(e) => handleProductLookup(index, e.target.value)}
                    defaultValue=""
                    className="w-full px-2 py-1.5 border border-zinc-300 bg-white rounded-none font-sans text-xs"
                  >
                    <option value="">-- Autofill from Catalog Index --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  
                  <input
                    type="text"
                    value={row.description}
                    placeholder="Enter manual explicit line description override..."
                    onChange={(e) => updateRowField(index, "description", e.target.value)}
                    className="w-full px-2 py-1.5 border border-black bg-white rounded-none font-sans text-xs mt-1"
                    required
                  />
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase block">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    value={row.quantity}
                    onChange={(e) => updateRowField(index, "quantity", parseFloat(e.target.value) || 1)}
                    className="w-full px-2 py-1.5 border border-black bg-white rounded-none font-bold text-center"
                    required
                  />
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase block">Unit Valuation Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={row.unitPrice}
                    onChange={(e) => updateRowField(index, "unitPrice", parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 border border-black bg-white rounded-none font-bold"
                    required
                  />
                </div>

                <div className="lg:col-span-2 space-y-1">
                  <label className="text-[10px] text-zinc-400 uppercase block">Tax Vector</label>
                  <select
                    value={row.taxType}
                    disabled={!shop.isVatRegistered}
                    onChange={(e) => updateRowField(index, "taxType", e.target.value)}
                    className="w-full px-2 py-1.5 border border-black bg-white rounded-none disabled:bg-zinc-100 disabled:text-zinc-400"
                  >
                    <option value="V_16">VAT Standard 16%</option>
                    <option value="V_0">0% VAT (Zero Rated)</option>
                    <option value="EXEMPT">Statutory Exempt</option>
                  </select>
                </div>

                <div className="lg:col-span-2 text-right font-bold py-2 bg-zinc-50 border border-zinc-200 px-3 self-center">
                  <span className="text-[9px] text-zinc-400 block font-mono font-normal">ROW TOTAL</span>
                  {formatCurrency(calculatedRow.itemTotal, shop.currency)}
                </div>

                <div className="lg:col-span-1 text-center">
                  <button
                    type="button"
                    onClick={() => removeRow(index)}
                    disabled={rows.length === 1}
                    className="border border-rose-200 text-rose-600 px-2 py-1 text-[10px] font-bold uppercase hover:bg-rose-50 hover:border-rose-600 disabled:opacity-20 rounded-none w-full"
                  >
                    Delete
                  </button>
                </div>

              </div>
            );
          })}
        </div>
        
        {/* ROW APPEND TRIGGER CONTROL */}
        <div className="p-4 border-t border-black bg-zinc-50">
          <button
            type="button"
            onClick={addBlankRow}
            className="border border-black bg-white text-black text-xs font-bold px-4 py-2 hover:bg-zinc-100 uppercase tracking-wide rounded-none"
          >
            + Append Line Item Entry
          </button>
        </div>
      </div>

      {/* BOTTOM AGGREGATIONS COMPILATION FOOTER GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-7 font-sans text-zinc-500 text-xs leading-relaxed max-w-md">
          &gt; Compliance Verification Node: All metrics evaluated natively using localized rounding filters. Uncommitted documents persist in standard editable DRAFT state nodes.
        </div>
        
        <div className="lg:col-span-5 border border-black divide-y divide-zinc-200 bg-white p-4 font-mono space-y-2">
          <div className="flex justify-between text-zinc-500 py-1">
            <span>Aggregated Sub-Total</span>
            <span className="font-bold text-black">{formatCurrency(totals.subTotal, shop.currency)}</span>
          </div>
          <div className="flex justify-between text-zinc-500 py-1">
            <span>Processed VAT Pool ({shop.isVatRegistered ? "16%" : "0%"})</span>
            <span className="font-bold text-black">{formatCurrency(totals.taxAmount, shop.currency)}</span>
          </div>
          <div className="flex justify-between text-black text-sm font-bold pt-2 border-t-2 border-black">
            <span>FINAL BALANCE PAYABLE</span>
            <span className="underline decoration-double">{formatCurrency(totals.grandTotal, shop.currency)}</span>
          </div>
          
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-black text-white text-center py-3 font-bold uppercase tracking-widest text-xs hover:bg-zinc-900 transition-colors disabled:bg-zinc-300 rounded-none"
            >
              {loading ? "EXECUTING COMPILATION TRANSACTION..." : "COMMIT BILLING COMPILATION"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}