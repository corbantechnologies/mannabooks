"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency, calculateDocumentTotals } from "@/lib/utils";
import { createBillingDocument } from "@/lib/actions/documents";
import { createClientProfile } from "@/lib/actions/clients";
import { toast } from "react-hot-toast";
import { ThermalReceiptModal, type ThermalReceiptData } from "@/components/ThermalReceiptModal";

interface WalkInSalesTerminalProps {
  shop: any;
  shopSlug: string;
  products: any[];
  clients?: any[]; // Pre-fetched client list for search
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

export function WalkInSalesTerminal({ shop, shopSlug, products, clients = [] }: WalkInSalesTerminalProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [paymentChannel, setPaymentChannel] = useState<"CASH" | "MPESA" | "BANK" | "OTHER">("MPESA");
  const [paymentReference, setPaymentReference] = useState("");
  const [customerNote, setCustomerNote] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerTaxPin, setCustomerTaxPin] = useState("");
  const [saveCustomer, setSaveCustomer] = useState(false);
  const [amountTendered, setAmountTendered] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [mobileView, setMobileView] = useState<"catalog" | "basket">("catalog");
  const [completedReceipt, setCompletedReceipt] = useState<ThermalReceiptData | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState<boolean>(false);

  // Client search state
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const clientSearchRef = useRef<HTMLDivElement>(null);

  // VAT toggle — session-only, available for ALL shops regardless of registration status
  const [isVatEnabled, setIsVatEnabled] = useState<boolean>(shop.isVatRegistered ?? false);

  // Basket Items
  const [basket, setBasket] = useState<PosBasketItem[]>([]);

  // Debounced client search
  useEffect(() => {
    if (!clientQuery.trim()) {
      setClientResults([]);
      return;
    }
    const q = clientQuery.toLowerCase();
    const results = clients.filter(
      (c) =>
        c.name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
    ).slice(0, 8);
    setClientResults(results);
  }, [clientQuery, clients]);

  // Close client dropdown on outside click
  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (clientSearchRef.current && !clientSearchRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  function selectClient(client: any) {
    setSelectedClientId(client.id);
    setCustomerName(client.name || "");
    setCustomerEmail(client.email || "");
    setCustomerPhone(client.phone || "");
    setCustomerTaxPin(client.taxPin || "");
    setClientQuery(client.name);
    setShowClientDropdown(false);
    setSaveCustomer(false); // Already exists, no need to save
  }

  function clearClientSelection() {
    setSelectedClientId(null);
    setCustomerName("");
    setCustomerEmail("");
    setCustomerPhone("");
    setCustomerTaxPin("");
    setClientQuery("");
    setClientResults([]);
  }


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
    // Auto-switch to basket view on mobile after adding
    if (window.innerWidth < 1024) {
      toast.success(`${product.name} added`, { duration: 1200, icon: "🛒" });
    }
  }

  function updateQuantity(index: number, newQty: number) {
    if (newQty <= 0) {
      setBasket(basket.filter((_, i) => i !== index));
    } else {
      const updated = [...basket];
      updated[index].quantity = newQty;
      setBasket(updated);
    }
  }

  function removeFromBasket(index: number) {
    setBasket(basket.filter((_, i) => i !== index));
  }

  // Summary Math — uses session VAT toggle (not necessarily shop.isVatRegistered)
  const totals = calculateDocumentTotals({
    items: basket.map((item) => ({
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      taxType: item.taxType,
    })),
    isShopVatRegistered: isVatEnabled,
  });

  const tenderedNum = parseFloat(amountTendered) || 0;
  const changeDue = Math.max(0, tenderedNum - totals.grandTotal);

  async function handleCheckout() {
    if (basket.length === 0) {
      toast.error("Your sale basket is empty. Add at least one item.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Processing walk-in sale & printing receipt...");

    // If user wants to save a new customer, create them first
    let resolvedClientId = selectedClientId || undefined;
    if (!selectedClientId && saveCustomer && customerName.trim()) {
      const clientRes = await createClientProfile({
        shopId: shop.id,
        shopSlug,
        name: customerName.trim(),
        clientType: "INDIVIDUAL",
        email: customerEmail.trim() || undefined,
        phone: customerPhone.trim() || undefined,
        taxPin: customerTaxPin.trim() || undefined,
      });
      if (clientRes.success && clientRes.clientId) {
        resolvedClientId = clientRes.clientId;
      }
    }

    const res = await createBillingDocument({
      shopId: shop.id,
      shopSlug,
      type: "RECEIPT",
      clientId: resolvedClientId,
      customerEmail: customerEmail.trim() || undefined,
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
      const displayName = customerName.trim() || customerEmail.trim() || "Walk-in Customer";
      setCompletedReceipt({
        shopName: shop.name,
        shopShortName: shop.shortName,
        shopPhone: shop.phone,
        shopEmail: shop.email,
        shopWebsite: shop.website,
        shopTaxPin: shop.taxPin,
        shopVatNumber: shop.vatNumber,
        currency: shop.currency || "KES",
        docNumber: res.serial || "RCT-001",
        docType: "RECEIPT",
        issueDate: new Date(),
        customerName: displayName,
        customerPhone: customerPhone.trim() || undefined,
        customerTaxPin: customerTaxPin.trim() || undefined,
        items: basket.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          itemTotal: item.quantity * item.unitPrice,
          taxType: item.taxType,
        })),
        subTotal: totals.subTotal,
        taxAmount: totals.taxAmount,
        grandTotal: totals.grandTotal,
        paymentChannel: paymentChannel,
        paymentReference: paymentReference.trim() || undefined,
        amountTendered: tenderedNum > 0 ? tenderedNum : totals.grandTotal,
        changeDue: changeDue,
        kraCuInvoiceNumber: undefined,
        cashierName: "Cashier Terminal",
        footerNote: "THANK YOU FOR SHOPPING WITH US!",
      });
      setShowReceiptModal(true);
      setBasket([]);
      setAmountTendered("");
      setPaymentReference("");
      setCustomerNote("");
      setCustomerEmail("");
      setCustomerName("");
      setCustomerPhone("");
      setCustomerTaxPin("");
      setClientQuery("");
      setSelectedClientId(null);
      setSaveCustomer(false);
    }
  }

  return (
    <div className="font-mono text-xs selection:bg-black selection:text-white">
      
      {/* MOBILE TAB TOGGLE */}
      <div className="lg:hidden flex mb-5 rounded-lg border border-zinc-200 overflow-hidden bg-zinc-50">
        <button
          type="button"
          onClick={() => setMobileView("catalog")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
            mobileView === "catalog" ? "bg-black text-white" : "text-zinc-500 hover:text-black"
          }`}
        >
          🏪 Catalog
          {products.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mobileView === "catalog" ? "bg-white/20 text-white" : "bg-zinc-200 text-zinc-600"}`}>
              {filteredProducts.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setMobileView("basket")}
          className={`flex-1 py-2.5 text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
            mobileView === "basket" ? "bg-black text-white" : "text-zinc-500 hover:text-black"
          }`}
        >
          🛒 Basket
          {basket.length > 0 && (
            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${mobileView === "basket" ? "bg-white/20 text-white" : "bg-black text-white"}`}>
              {basket.length}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: PRODUCT CATALOG (7 cols) */}
        <div className={`lg:col-span-7 space-y-4 ${mobileView === "basket" ? "hidden lg:block" : "block"}`}>
          
          {/* SEARCH */}
          <div className="bg-white border border-zinc-200/80 rounded-xl p-4 shadow-sm space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-sans text-xs font-bold uppercase tracking-tight text-black">
                Catalog Quick Picker
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {filteredProducts.length} items · click to add
              </span>
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Search items by name or SKU..."
              className="w-full px-3.5 py-2.5 border border-zinc-300 bg-white rounded-lg font-sans text-xs focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* PRODUCT GRID */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredProducts.map((p) => {
              const stockVal = parseFloat(p.stockQuantity || "0");
              const isLow = p.trackStock && stockVal <= parseFloat(p.reorderThreshold || "5") && stockVal > 0;
              const isOut = p.trackStock && stockVal <= 0;
              const basketQty = basket.find((b) => b.productId === p.id)?.quantity || 0;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addToBasket(p)}
                  disabled={isOut}
                  className={`bg-white border rounded-xl p-4 text-left shadow-sm transition-all flex flex-col justify-between space-y-3 group relative ${
                    isOut
                      ? "opacity-50 cursor-not-allowed border-zinc-200"
                      : "hover:border-black hover:shadow-md border-zinc-200/80 cursor-pointer"
                  }`}
                >
                  {/* Cart indicator badge */}
                  {basketQty > 0 && (
                    <span className="absolute top-3 right-3 w-5 h-5 bg-black text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      {basketQty}
                    </span>
                  )}

                  <div>
                    <div className="flex justify-between items-start gap-2 pr-6">
                      <span className="font-sans text-sm font-bold uppercase tracking-tight text-black group-hover:text-emerald-700 transition-colors leading-tight">
                        {p.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                      SKU: {p.sku || "N/A"}
                    </span>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-zinc-100 font-sans">
                    <span className="text-sm font-bold text-black">
                      {formatCurrency(parseFloat(p.unitPrice), shop.currency)}
                    </span>
                    <div className="flex items-center gap-2">
                      {p.trackStock && (
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${
                          isOut
                            ? "bg-rose-100 text-rose-800"
                            : isLow
                            ? "bg-amber-100 text-amber-900"
                            : "bg-emerald-100 text-emerald-900"
                        }`}>
                          {isOut ? "OUT" : isLow ? `⚠ ${stockVal}` : `${stockVal} left`}
                        </span>
                      )}
                      {!isOut && (
                        <span className="text-[10px] font-bold uppercase text-black bg-zinc-100 group-hover:bg-black group-hover:text-white px-2.5 py-1 rounded-lg transition-colors">
                          + Add
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredProducts.length === 0 && (
              <div className="col-span-full bg-white border border-zinc-200 p-10 rounded-xl text-center text-zinc-400 italic font-sans">
                No matching products found in catalog.
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: BASKET & CHECKOUT (5 cols) */}
        <div className={`lg:col-span-5 ${mobileView === "catalog" ? "hidden lg:block" : "block"}`}>
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-sm overflow-hidden sticky top-4">
            
            {/* CHECKOUT HEADER */}
            <div className="border-b border-zinc-100 p-4 flex justify-between items-center bg-zinc-50/50">
              <h2 className="font-sans text-sm font-bold uppercase tracking-tight text-black flex items-center gap-2">
                ⚡ Counter Checkout
              </h2>
              <span className="text-[10px] border border-emerald-300 bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase">
                Official Receipt (PAID)
              </span>
            </div>

            {/* BASKET ITEMS */}
            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {basket.length === 0 ? (
                <div className="py-10 border border-dashed border-zinc-300 rounded-xl text-center text-zinc-400 space-y-2">
                  <span className="text-2xl block">🛒</span>
                  <span className="font-sans text-xs block font-semibold text-zinc-500">Sale Basket Empty</span>
                  <span className="text-[10px] block">Click products to add them here.</span>
                </div>
              ) : (
                basket.map((item, index) => {
                  const rowTotal = item.quantity * item.unitPrice;
                  const isOver = item.trackStock && item.quantity > item.availableStock;

                  return (
                    <div key={index} className={`border rounded-lg p-3 space-y-2 ${isOver ? "border-amber-300 bg-amber-50" : "border-zinc-200 bg-zinc-50"}`}>
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <span className="font-sans text-xs font-bold uppercase text-black block truncate">{item.description}</span>
                          <span className="text-[10px] text-zinc-500">{formatCurrency(item.unitPrice, shop.currency)} each</span>
                        </div>

                        <div className="flex items-center gap-1 ml-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity - 1)}
                            className="w-7 h-7 border border-zinc-300 bg-white hover:bg-zinc-100 rounded-lg font-bold text-center flex items-center justify-center text-sm"
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const v = parseInt(e.target.value);
                              if (!isNaN(v)) updateQuantity(index, v);
                            }}
                            className="w-10 text-center font-bold text-xs border border-zinc-300 rounded-md h-7 bg-white focus:outline-none focus:border-black"
                          />
                          <button
                            type="button"
                            onClick={() => updateQuantity(index, item.quantity + 1)}
                            className="w-7 h-7 border border-zinc-300 bg-white hover:bg-zinc-100 rounded-lg font-bold text-center flex items-center justify-center text-sm"
                          >
                            +
                          </button>
                          <button
                            type="button"
                            onClick={() => removeFromBasket(index)}
                            className="text-rose-500 hover:text-rose-700 ml-0.5 w-7 h-7 flex items-center justify-center rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-1 border-t border-zinc-200">
                        <span>Subtotal:</span>
                        <span className="font-bold text-black font-sans text-xs">{formatCurrency(rowTotal, shop.currency)}</span>
                      </div>

                      {isOver && (
                        <div className="text-[9px] font-bold text-amber-800 bg-amber-100 px-2 py-1 rounded-md">
                          ⚠ Qty ({item.quantity}) exceeds stock ({item.availableStock} available)
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* PAYMENT METHOD */}
            <div className="border-t border-zinc-100 p-4 space-y-3">
              <label className="text-[10px] text-zinc-400 uppercase block font-semibold">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "MPESA", emoji: "📱", label: "M-PESA" },
                  { id: "CASH", emoji: "💵", label: "CASH" },
                  { id: "BANK", emoji: "💳", label: "BANK" },
                ].map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentChannel(method.id as any)}
                    className={`py-2 text-center font-bold uppercase rounded-lg border text-[10px] transition-all ${
                      paymentChannel === method.id
                        ? method.id === "MPESA"
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-black text-white border-black shadow-sm"
                        : "bg-white text-zinc-600 border-zinc-300 hover:border-black"
                    }`}
                  >
                    {method.emoji} {method.label}
                  </button>
                ))}
              </div>

              {/* CASH CHANGE CALCULATOR */}
              {paymentChannel === "CASH" && (
                <div className="bg-zinc-50 border border-zinc-200 p-3 rounded-lg space-y-2">
                  <label className="text-[10px] text-zinc-500 font-semibold uppercase block">Amount Received</label>
                  <input
                    type="number"
                    step="1"
                    value={amountTendered}
                    onChange={(e) => setAmountTendered(e.target.value)}
                    placeholder={`e.g. ${Math.ceil(totals.grandTotal / 100) * 100}`}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white rounded-lg font-sans font-bold text-sm focus:outline-none focus:border-black"
                  />
                  {tenderedNum > 0 && (
                    <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-zinc-200">
                      <span className="text-zinc-600 uppercase">Change to Return:</span>
                      <span className={`font-mono text-sm ${changeDue > 0 ? "text-emerald-700" : "text-zinc-500"}`}>
                        {formatCurrency(changeDue, shop.currency)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* MPESA REFERENCE */}
              {paymentChannel === "MPESA" && (
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  placeholder="Enter M-Pesa Transaction Ref (e.g. QAB71239X)..."
                  className="w-full px-3 py-2.5 border border-zinc-300 bg-white rounded-lg uppercase text-xs focus:outline-none focus:border-black"
                />
              )}

              {/* CUSTOMER SECTION */}
              <div className="space-y-3">
                <label className="text-[10px] text-zinc-400 uppercase block font-semibold">Customer (Optional)</label>

                {/* CLIENT SEARCH */}
                <div className="relative" ref={clientSearchRef}>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={clientQuery}
                      onChange={(e) => {
                        setClientQuery(e.target.value);
                        setShowClientDropdown(true);
                        if (!e.target.value.trim()) clearClientSelection();
                      }}
                      onFocus={() => clientQuery.trim() && setShowClientDropdown(true)}
                      placeholder="🔍 Search existing clients..."
                      className="flex-1 px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-black font-sans text-xs"
                    />
                    {selectedClientId && (
                      <button
                        type="button"
                        onClick={clearClientSelection}
                        className="px-2 py-1.5 text-[10px] font-bold text-rose-600 border border-rose-200 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors whitespace-nowrap"
                      >
                        ✕ Clear
                      </button>
                    )}
                  </div>

                  {/* DROPDOWN RESULTS */}
                  {showClientDropdown && clientResults.length > 0 && (
                    <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-zinc-200 rounded-xl shadow-xl overflow-hidden">
                      {clientResults.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onMouseDown={() => selectClient(c)}
                          className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 transition-colors border-b border-zinc-100 last:border-0"
                        >
                          <span className="font-sans text-xs font-bold text-black block">{c.name}</span>
                          <span className="font-sans text-[10px] text-zinc-500">
                            {[c.email, c.phone, c.taxPin ? `PIN: ${c.taxPin}` : null].filter(Boolean).join(" · ")}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* NEW CUSTOMER FIELDS (shown when no client selected) */}
                {!selectedClientId && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Full Name..."
                        className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-black font-sans text-xs"
                      />
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="Phone (e.g. 0712...)"
                        className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-black font-sans text-xs"
                      />
                    </div>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="Email (for digital receipt)..."
                      className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-black font-sans text-xs"
                    />
                    <input
                      type="text"
                      value={customerTaxPin}
                      onChange={(e) => setCustomerTaxPin(e.target.value.toUpperCase())}
                      placeholder="KRA/Tax PIN (e.g. A123456789B)..."
                      className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-black font-mono text-xs uppercase"
                    />
                    {customerName.trim() && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={saveCustomer}
                          onChange={(e) => setSaveCustomer(e.target.checked)}
                          className="w-3.5 h-3.5 accent-emerald-700 cursor-pointer"
                        />
                        <span className="font-sans text-[10px] text-zinc-600 font-medium">
                          Save as client record for future lookups
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {/* Show selected client card */}
                {selectedClientId && (
                  <div className="bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg">
                    <span className="font-sans text-[10px] font-bold text-emerald-900 block">{customerName}</span>
                    <span className="font-sans text-[10px] text-emerald-700">
                      {[customerEmail, customerPhone, customerTaxPin ? `PIN: ${customerTaxPin}` : null].filter(Boolean).join(" · ") || "No contact info"}
                    </span>
                  </div>
                )}

                <textarea
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Add a customer note or reference (optional)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-zinc-200 bg-white rounded-lg focus:outline-none focus:border-black resize-none font-sans text-xs"
                />
              </div>
            </div>

            {/* TOTALS & CHECKOUT */}
            <div className="border-t border-zinc-200 p-4 space-y-3">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-zinc-500">
                  <span>Sub-Total:</span>
                  <span className="font-semibold text-black">{formatCurrency(totals.subTotal, shop.currency)}</span>
                </div>

                {/* VAT TOGGLE — available for all shops */}
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <div
                      onClick={() => setIsVatEnabled(!isVatEnabled)}
                      className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                        isVatEnabled ? "bg-emerald-600" : "bg-zinc-300"
                      }`}
                    >
                      <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full shadow transition-transform ${
                        isVatEnabled ? "translate-x-4" : "translate-x-0"
                      }`} />
                    </div>
                    <span className={`text-[10px] font-semibold uppercase ${isVatEnabled ? "text-emerald-700" : "text-zinc-500"}`}>
                      VAT ({isVatEnabled ? "16%" : "0%"})
                    </span>
                  </label>
                  <span className="font-semibold text-black">{formatCurrency(totals.taxAmount, shop.currency)}</span>
                </div>

                <div className="flex justify-between text-black font-bold text-sm pt-2 border-t border-zinc-200">
                  <span className="uppercase">Total Payable:</span>
                  <span className="text-base font-extrabold">{formatCurrency(totals.grandTotal, shop.currency)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={loading || basket.length === 0}
                className="w-full py-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase text-sm rounded-xl shadow-md transition-all disabled:bg-zinc-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 tracking-wide"
              >
                {loading ? (
                  <span>⏳ Processing Sale...</span>
                ) : (
                  <span>⚡ Complete Sale &amp; Print Receipt</span>
                )}
              </button>
            </div>

          </div>
        </div>
      </div>
      {/* THERMAL RECEIPT MODAL */}
      {completedReceipt && (
        <ThermalReceiptModal
          receipt={completedReceipt}
          isOpen={showReceiptModal}
          onClose={() => setShowReceiptModal(false)}
        />
      )}
    </div>
  );
}
