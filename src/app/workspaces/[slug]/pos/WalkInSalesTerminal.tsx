// src/app/workspaces/[slug]/pos/WalkInSalesTerminal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, calculateLineItem, calculateDocumentTotals } from "@/lib/utils";
import { createBillingDocument } from "@/lib/actions/documents";
import { toast } from "react-hot-toast";

interface WalkInSalesTerminalProps {
  shop: any;
  shopSlug: string;
  products: any[];
}

interface PosBasketItem {
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxType: "V_16" | "V_0" | "EXEMPT";
  availableStock: number;
  trackStock: boolean;
}

export function WalkInSalesTerminal({ shop, shopSlug, products }: WalkInSalesTerminalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [paymentChannel, setPaymentChannel] = useState<"CASH" | "MPESA" | "BANK" | "OTHER">("MPESA");
  const [paymentReference, setPaymentReference] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // Basket Items
  const [basket, setBasket] = useState<PosBasketItem[]>([]);

  // Filter Catalog
  const filteredProducts = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) || (p.sku && p.sku.toLowerCase().includes(q));
  });

  function addToBasket(product: any) {
    const stockVal = parseFloat(product.stockQuantity || "0");
    const existingIndex = basket.findIndex((item) => item.productId === product.id);

    if (existingIndex > -1) {
      const updated = [...basket];
      updated[existingIndex].quantity += 1;
      setBasket(updated);
    } else {
      setBasket([
        ...basket,
        {
          productId: product.id,
          description: product.name,
          quantity: 1,
          unitPrice: parseFloat(product.unitPrice),
          taxType: product.defaultTaxType,
          availableStock: stockVal,
          trackStock: product.trackStock,
        },
      ]);
    }
  }

  function updateQuantity(index: number, delta: number) {
    const updated = [...basket];
    const newQty = updated[index].quantity + delta;
    if (newQty <= 0) {
      setBasket(basket.filter((_, i) => i !== index));
    } else {
      updated[index].quantity = newQty;
      setBasket(updated);
    }
  }

  function removeFromBasket(index: number) {
    setBasket(basket.filter((_, i) => i !== index));
  }

  // Summary Math
  const totals = calculateDocumentTotals({
    items: basket.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxType: item.taxType,
    })),
    isShopVatRegistered: shop.isVatRegistered,
  });

  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totals.grandTotal);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (basket.length === 0) {
      toast.error("Your sale basket is empty. Add at least one item.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Processing walk-in sale & printing receipt...");

    const res = await createBillingDocument({
      shopId: shop.id,
      shopSlug,
      type: "RECEIPT",
      notes: customerNote.trim() || undefined,
      items: basket.map((item) => ({
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxType: item.taxType,
      })),
    });

    setLoading(false);
    if (!res.success) {
      toast.error(res.error || "Failed to complete walk-in sale.", { id: toastId });
    } else {
      toast.success(`⚡ Walk-in Sale Completed! (${res.serial})`, { id: toastId });
      router.push(`/workspaces/${shopSlug}/documents/${res.documentId}`);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 font-mono text-xs selection:bg-black selection:text-white">
      
      {/* LEFT PANEL: PRODUCT CATALOG QUICK PICKER (7 COLS) */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* SEARCH BAR */}
        <div className="bg-white border border-zinc-200/80 rounded-lg p-4 shadow-sm space-y-3">
          <div className="flex justify-between items-center">
            <span className="font-sans text-xs font-bold uppercase tracking-tight text-black">
              1. Catalog Quick Picker
            </span>
            <span className="text-[10px] text-zinc-400 font-mono">
              Click item to add to basket
            </span>
          </div>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Search items by name or SKU code..."
            className="w-full px-3.5 py-2.5 border border-zinc-300 bg-white rounded-md font-sans text-xs focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {/* PRODUCTS GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filteredProducts.map((p) => {
            const stockVal = parseFloat(p.stockQuantity || "0");
            const isLow = p.trackStock && stockVal <= parseFloat(p.reorderThreshold || "5") && stockVal > 0;
            const isOut = p.trackStock && stockVal <= 0;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => addToBasket(p)}
                className="bg-white border border-zinc-200/80 hover:border-black rounded-lg p-4 text-left shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-sans text-sm font-bold uppercase tracking-tight text-black group-hover:text-emerald-700 transition-colors">
                      {p.name}
                    </span>
                    {p.trackStock && (
                      <span
                        className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded ${
                          isOut
                            ? "bg-rose-100 text-rose-800 border border-rose-300"
                            : isLow
                            ? "bg-amber-100 text-amber-900 border border-amber-300"
                            : "bg-emerald-100 text-emerald-900 border border-emerald-300"
                        }`}
                      >
                        {isOut ? "OUT" : isLow ? `⚠️ ${stockVal} left` : `${stockVal} in stock`}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                    SKU: {p.sku || "N/A"}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-zinc-100 font-sans">
                  <span className="text-xs font-bold text-black">
                    {formatCurrency(parseFloat(p.unitPrice), shop.currency)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-black bg-zinc-100 group-hover:bg-black group-hover:text-white px-2.5 py-1 rounded transition-colors">
                    + Add to Sale
                  </span>
                </div>
              </button>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="col-span-full bg-white border border-zinc-200 p-8 rounded-lg text-center text-zinc-400 italic">
              No matching products found in catalog.
            </div>
          )}
        </div>

      </div>

      {/* RIGHT PANEL: ACTIVE BASKET & CHECKOUT (5 COLS) */}
      <div className="lg:col-span-5 bg-white border border-zinc-200/80 rounded-lg p-6 shadow-sm space-y-6">
        <div className="border-b border-zinc-100 pb-3 flex justify-between items-center">
          <h2 className="font-sans text-sm font-bold uppercase tracking-tight text-black flex items-center gap-2">
            <span>⚡ Counter Checkout</span>
          </h2>
          <span className="text-[10px] border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold px-2 py-0.5 rounded uppercase">
            Official Receipt (PAID)
          </span>
        </div>

        {/* BASKET ITEMS LIST */}
        <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
          {basket.length === 0 ? (
            <div className="p-8 border border-dashed border-zinc-300 rounded-md text-center text-zinc-400 space-y-1">
              <span className="text-xl block">🛒</span>
              <span className="font-sans text-xs block font-semibold text-zinc-500">Sale Basket Empty</span>
              <span className="text-[10px] block">Click items on the left to add them to this walk-in sale.</span>
            </div>
          ) : (
            basket.map((item, index) => {
              const rowTotal = item.quantity * item.unitPrice;
              const isOver = item.trackStock && item.quantity > item.availableStock;

              return (
                <div key={index} className="bg-zinc-50 border border-zinc-200 p-3 rounded-md space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-sans text-xs font-bold uppercase text-black block">
                        {item.description}
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        {formatCurrency(item.unitPrice, shop.currency)} each
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, -1)}
                        className="w-6 h-6 border border-zinc-300 bg-white hover:bg-zinc-200 rounded font-bold text-center flex items-center justify-center text-xs"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-xs">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, 1)}
                        className="w-6 h-6 border border-zinc-300 bg-white hover:bg-zinc-200 rounded font-bold text-center flex items-center justify-center text-xs"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromBasket(index)}
                        className="text-rose-600 hover:text-rose-800 ml-1 p-1 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1 border-t border-zinc-200">
                    <span>Row Total:</span>
                    <span className="font-bold text-black font-sans text-xs">
                      {formatCurrency(rowTotal, shop.currency)}
                    </span>
                  </div>

                  {isOver && (
                    <div className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                      ⚠️ Qty ({item.quantity}) exceeds available stock ({item.availableStock})
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* PAYMENT METHOD SELECTOR */}
        <div className="space-y-3 pt-2 border-t border-zinc-100">
          <label className="text-[10px] text-zinc-400 uppercase block font-semibold">Payment Method</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setPaymentChannel("MPESA")}
              className={`py-2 px-1 text-center font-bold uppercase rounded border text-[10px] transition-all ${
                paymentChannel === "MPESA"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                  : "bg-white text-zinc-600 border-zinc-300 hover:border-black"
              }`}
            >
              📱 M-PESA
            </button>
            <button
              type="button"
              onClick={() => setPaymentChannel("CASH")}
              className={`py-2 px-1 text-center font-bold uppercase rounded border text-[10px] transition-all ${
                paymentChannel === "CASH"
                  ? "bg-black text-white border-black shadow-sm"
                  : "bg-white text-zinc-600 border-zinc-300 hover:border-black"
              }`}
            >
              💵 CASH
            </button>
            <button
              type="button"
              onClick={() => setPaymentChannel("BANK")}
              className={`py-2 px-1 text-center font-bold uppercase rounded border text-[10px] transition-all ${
                paymentChannel === "BANK"
                  ? "bg-black text-white border-black shadow-sm"
                  : "bg-white text-zinc-600 border-zinc-300 hover:border-black"
              }`}
            >
              💳 BANK/CARD
            </button>
          </div>

          {/* CASH TENDERED & CHANGE CALCULATOR */}
          {paymentChannel === "CASH" && (
            <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-md space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-zinc-500 font-semibold uppercase">Amount Received from Customer</label>
              </div>
              <input
                type="number"
                step="1"
                value={amountTendered}
                onChange={(e) => setAmountTendered(e.target.value)}
                placeholder={`e.g. ${totals.grandTotal}`}
                className="w-full px-3 py-2 border border-zinc-300 bg-white rounded font-sans font-bold text-sm focus:outline-none focus:border-black"
              />
              {tenderedNum > 0 && (
                <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-zinc-200">
                  <span className="text-zinc-600">CHANGE TO RETURN:</span>
                  <span className="text-emerald-700 font-mono text-sm">
                    {formatCurrency(changeDue, shop.currency)}
                  </span>
                </div>
              )}
            </div>
          )}

          {paymentChannel === "MPESA" && (
            <input
              type="text"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
              placeholder="Enter M-Pesa Transaction Ref (e.g. QAB71239X)..."
              className="w-full px-3 py-2 border border-zinc-300 bg-white rounded uppercase text-xs focus:outline-none focus:border-black"
            />
          )}
        </div>

        {/* FINANCIAL SUMMARY & SUBMIT */}
        <div className="space-y-3 pt-3 border-t border-zinc-200">
          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-zinc-500">
              <span>Sub-Total:</span>
              <span className="font-semibold text-black">{formatCurrency(totals.subTotal, shop.currency)}</span>
            </div>
            <div className="flex justify-between text-zinc-500">
              <span>VAT Tax Pool ({shop.isVatRegistered ? "16%" : "0%"}):</span>
              <span className="font-semibold text-black">{formatCurrency(totals.taxAmount, shop.currency)}</span>
            </div>
            <div className="flex justify-between text-black font-bold text-sm pt-2 border-t border-zinc-200">
              <span>TOTAL PAYABLE:</span>
              <span className="text-base font-extrabold text-black">{formatCurrency(totals.grandTotal, shop.currency)}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCheckout}
            disabled={loading || basket.length === 0}
            className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase text-xs rounded-md shadow-md transition-colors disabled:bg-zinc-300 flex items-center justify-center gap-2"
          >
            <span>{loading ? "PROCESSING SALE..." : "⚡ COMPLETE SALE & PRINT RECEIPT"}</span>
          </button>
        </div>

      </div>

    </div>
  );
}
