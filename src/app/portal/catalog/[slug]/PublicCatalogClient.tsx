"use client";

import { useState, useMemo, useTransition } from "react";
import { PublicCatalogItem, PublicShopProfile, requestCatalogQuotationAction } from "@/lib/actions/catalog";
import { formatCurrency } from "@/lib/utils";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";
import Link from "next/link";

interface PublicCatalogClientProps {
  shop: PublicShopProfile;
  initialProducts: PublicCatalogItem[];
  initialSearch?: string;
  token?: string;
}

interface SelectedItem {
  product: PublicCatalogItem;
  quantity: number;
  notes?: string;
}

export function PublicCatalogClient({
  shop,
  initialProducts,
  initialSearch = "",
  token = "",
}: PublicCatalogClientProps) {
  const [search, setSearch] = useState(initialSearch);
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [selectedItems, setSelectedItems] = useState<Record<string, SelectedItem>>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Quote Request Form
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [submittedQuote, setSubmittedQuote] = useState<{
    serial: string;
    token?: string;
    documentId?: string;
    grandTotal?: string;
  } | null>(null);

  // Client-side filtering
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((p) => {
      const matchesSearch =
        !search.trim() ||
        p.name.toLowerCase().includes(search.toLowerCase().trim()) ||
        (p.sku && p.sku.toLowerCase().includes(search.toLowerCase().trim()));

      const matchesType =
        selectedType === "ALL" || p.itemType === selectedType;

      return matchesSearch && matchesType;
    });
  }, [initialProducts, search, selectedType]);

  const selectedCount = Object.keys(selectedItems).length;

  const estimatedTotal = useMemo(() => {
    return Object.values(selectedItems).reduce((sum, item) => {
      return sum + item.product.unitPrice * item.quantity;
    }, 0);
  }, [selectedItems]);

  function handleQuantityChange(product: PublicCatalogItem, delta: number) {
    setSelectedItems((prev) => {
      const current = prev[product.id];
      const currentQty = current ? current.quantity : 0;
      const nextQty = currentQty + delta;

      if (nextQty <= 0) {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      }

      return {
        ...prev,
        [product.id]: {
          product,
          quantity: nextQty,
          notes: current?.notes || "",
        },
      };
    });
  }

  function handleDirectQuantitySet(product: PublicCatalogItem, qty: number) {
    if (qty <= 0) {
      setSelectedItems((prev) => {
        const copy = { ...prev };
        delete copy[product.id];
        return copy;
      });
    } else {
      setSelectedItems((prev) => ({
        ...prev,
        [product.id]: {
          product,
          quantity: qty,
          notes: prev[product.id]?.notes || "",
        },
      }));
    }
  }

  function handleItemNotesChange(productId: string, notes: string) {
    setSelectedItems((prev) => {
      if (!prev[productId]) return prev;
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          notes,
        },
      };
    });
  }

  function handleSubmitQuoteRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!customerName.trim()) {
      toast.error("Please enter your name or company name.");
      return;
    }

    if (selectedCount === 0) {
      toast.error("Please select at least one item from the catalog.");
      return;
    }

    startTransition(async () => {
      const res = await requestCatalogQuotationAction({
        shopId: shop.id,
        shopSlug: shop.slug,
        customerName,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        customerNotes: customerNotes || undefined,
        items: Object.values(selectedItems).map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
          notes: i.notes || undefined,
        })),
      });

      if (res.success && res.serial) {
        setSubmittedQuote({
          serial: res.serial,
          token: res.token,
          documentId: res.documentId,
          grandTotal: res.grandTotal,
        });
        setSelectedItems({});
        toast.success(`Quotation ${res.serial} issued successfully!`);
      } else {
        toast.error((res as any).error || "Failed to submit quote request.");
      }
    });
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8 font-sans">
      {/* HEADER SECTION */}
      <header className="bg-white border border-zinc-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-zinc-100 pb-6">
          <div className="flex items-center gap-4">
            {shop.logoUrl ? (
              <img
                src={shop.logoUrl}
                alt={shop.name}
                className="w-16 h-16 object-contain rounded-xl border border-zinc-200 bg-zinc-50 p-1"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold text-xl uppercase shadow-sm"
                style={{ backgroundColor: shop.primaryColor || "#000000" }}
              >
                {shop.name.substring(0, 2)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-black">
                  {shop.name}
                </h1>
                {shop.shortName && (
                  <span className="font-mono text-[10px] uppercase font-bold bg-zinc-100 px-2 py-0.5 rounded text-zinc-600">
                    {shop.shortName}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 font-mono mt-1">
                Official Digital Product Catalog &amp; Price List
              </p>
            </div>
          </div>

          {/* TOP QUICK ACTION BUTTONS */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <a
              href={`/api/catalog/${shop.slug}/pdf?${new URLSearchParams({
                ...(token ? { token } : {}),
                ...(search ? { search } : {}),
              }).toString()}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none border border-zinc-300 hover:border-black bg-white hover:bg-zinc-50 text-black px-4 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all shadow-sm flex items-center justify-center gap-2"
            >
              <span>📄</span>
              <span>Download PDF</span>
            </a>

            {selectedCount > 0 && (
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="flex-1 sm:flex-none bg-black hover:bg-zinc-800 text-white px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-all shadow-sm flex items-center justify-center gap-2 animate-in zoom-in-95 duration-150"
              >
                <span>📋</span>
                <span>Request Quote ({selectedCount})</span>
              </button>
            )}
          </div>
        </div>

        {/* BUSINESS CONTACT BADGES */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-600">
          {shop.phone && (
            <a
              href={`tel:${shop.phone.replace(/[^0-9+]/g, "")}`}
              className="hover:text-black flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 transition-colors"
            >
              <span>📞</span>
              <span>{shop.phone}</span>
            </a>
          )}
          {shop.phone && (
            <a
              href={`https://wa.me/${shop.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${shop.name}, I am inquiring about your product catalog.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-emerald-700 flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-200 transition-colors font-semibold"
            >
              <span>💬</span>
              <span>Chat on WhatsApp</span>
            </a>
          )}
          {shop.email && (
            <a
              href={`mailto:${shop.email}`}
              className="hover:text-black flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 transition-colors"
            >
              <span>✉️</span>
              <span>{shop.email}</span>
            </a>
          )}
          {shop.website && (
            <a
              href={shop.website.startsWith("http") ? shop.website : `https://${shop.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-black flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200 transition-colors"
            >
              <span>🌐</span>
              <span>{shop.website}</span>
            </a>
          )}
          {shop.taxPin && (
            <div className="flex items-center gap-1.5 bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
              <span className="font-bold">KRA PIN:</span>
              <span>{shop.taxPin}</span>
            </div>
          )}
        </div>
      </header>

      {/* SEARCH & FILTER CONTROLS */}
      <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 text-sm">🔍</span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by model, brand, description, or SKU..."
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 rounded-lg text-xs font-medium placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-black bg-zinc-50/50 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black text-xs font-mono"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedType("ALL")}
            className={`px-3 py-2 rounded-lg font-mono text-xs uppercase font-bold transition-all ${
              selectedType === "ALL"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:text-black"
            }`}
          >
            All ({initialProducts.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("PRODUCT")}
            className={`px-3 py-2 rounded-lg font-mono text-xs uppercase font-bold transition-all ${
              selectedType === "PRODUCT"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:text-black"
            }`}
          >
            Physical
          </button>
          <button
            type="button"
            onClick={() => setSelectedType("SERVICE")}
            className={`px-3 py-2 rounded-lg font-mono text-xs uppercase font-bold transition-all ${
              selectedType === "SERVICE"
                ? "bg-black text-white"
                : "border border-zinc-200 bg-white text-zinc-600 hover:text-black"
            }`}
          >
            Services
          </button>
        </div>
      </div>

      {/* SUCCESS CONFIRMATION MODAL */}
      {submittedQuote && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-6 sm:p-8 space-y-4 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-4">
            <span className="text-3xl">🎉</span>
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-emerald-950">
                Quote Request Submitted Successfully!
              </h2>
              <p className="text-xs text-emerald-800 font-mono">
                Your request reference number is: <strong>{submittedQuote.serial}</strong>
              </p>
              <p className="text-xs text-emerald-700 font-sans mt-2">
                Our sales team at <strong>{shop.name}</strong> has received your selected items and is preparing your formal quotation with delivery and payment terms. We will reach out to you shortly.
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setSubmittedQuote(null)}
              className="bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-2 rounded-lg font-mono text-xs uppercase font-bold"
            >
              Continue Browsing
            </button>
          </div>
        </div>
      )}

      {/* PRODUCTS LISTING */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <span className="font-mono text-xs uppercase font-bold text-zinc-500 tracking-wider">
            Available Models &amp; Products ({filteredProducts.length})
          </span>
          {selectedCount > 0 && (
            <span className="font-mono text-xs font-bold text-emerald-700">
              {selectedCount} item{selectedCount > 1 ? "s" : ""} selected for quotation
            </span>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-zinc-200 rounded-2xl p-12 text-center text-zinc-400 space-y-2">
            <p className="text-sm font-semibold">No products found matching &ldquo;{search}&rdquo;</p>
            <p className="text-xs font-mono">Try searching with a broader keyword or clear your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map((p) => {
              const isSelected = !!selectedItems[p.id];
              const qty = selectedItems[p.id]?.quantity || 0;

              return (
                <div
                  key={p.id}
                  className={`bg-white border rounded-2xl p-5 space-y-4 transition-all flex flex-col justify-between ${
                    isSelected
                      ? "border-black ring-1 ring-black shadow-md bg-zinc-50/40"
                      : "border-zinc-200 hover:border-zinc-300 shadow-sm"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-bold text-sm text-black leading-snug">
                        {p.name}
                      </h3>
                      <span className="font-mono text-xs uppercase font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded shrink-0">
                        {p.itemType}
                      </span>
                    </div>

                    {p.sku && (
                      <p className="font-mono text-[11px] text-zinc-400">
                        SKU: <span className="text-zinc-600 font-semibold">{p.sku}</span>
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase text-zinc-400 font-bold block">
                        Selling Price
                      </span>
                      <span className="text-base sm:text-lg font-extrabold font-mono text-black">
                        {formatCurrency(p.unitPrice, shop.currency)}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-400 block">
                        {p.defaultTaxType === "V_16" ? "VAT 16% Standard" : "Tax Exempt"}
                      </span>
                    </div>

                    {/* SELECT / QUANTITY STEPPER */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected ? (
                        <div className="flex items-center border border-black rounded-lg bg-white overflow-hidden shadow-sm">
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(p, -1)}
                            className="px-3 py-1.5 hover:bg-zinc-100 font-mono font-bold text-xs"
                          >
                            −
                          </button>
                          <span className="px-3 py-1.5 font-mono font-bold text-xs text-black border-x border-zinc-200 min-w-[32px] text-center">
                            {qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleQuantityChange(p, 1)}
                            className="px-3 py-1.5 hover:bg-zinc-100 font-mono font-bold text-xs"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(p, 1)}
                          className="bg-zinc-900 hover:bg-black text-white px-3.5 py-2 rounded-lg font-mono text-xs font-bold uppercase transition-all shadow-sm flex items-center gap-1.5"
                        >
                          <span>+</span>
                          <span>Select</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FLOATING ACTION BAR FOR MOBILE / QUICK TRIGGER */}
      {selectedCount > 0 && !isDrawerOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-xl bg-black text-white border border-zinc-800 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-6">
          <div>
            <p className="font-mono text-xs uppercase font-bold text-emerald-400">
              {selectedCount} item{selectedCount > 1 ? "s" : ""} selected
            </p>
            <p className="font-mono text-sm font-extrabold text-white">
              Est: {formatCurrency(estimatedTotal, shop.currency)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="bg-white hover:bg-zinc-100 text-black px-5 py-2.5 rounded-xl font-mono text-xs font-bold uppercase transition-colors shadow-sm"
          >
            Review &amp; Request Quote →
          </button>
        </div>
      )}

      {/* SLIDE-OVER / MODAL QUOTE REQUEST DRAWER */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white border border-zinc-200 rounded-2xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            {submittedQuote ? (
              /* CONFIRMATION / SUCCESS VIEW */
              <div className="space-y-6 text-center py-4 animate-in zoom-in-95 duration-200">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto text-3xl font-bold shadow-inner">
                  ✓
                </div>

                <div className="space-y-2">
                  <span className="font-mono text-xs font-bold uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
                    Official Quotation {submittedQuote.serial} Issued
                  </span>
                  <h2 className="text-2xl font-extrabold text-black font-sans">
                    Quotation Request Received!
                  </h2>
                  <p className="text-xs text-zinc-600 font-sans max-w-md mx-auto leading-relaxed">
                    {customerEmail ? (
                      <>
                        A formal quotation estimate has been generated and emailed to{" "}
                        <strong className="text-black">{customerEmail}</strong>. Our sales team at{" "}
                        <strong>{shop.name}</strong> will also follow up on your request.
                      </>
                    ) : (
                      <>
                        Your quotation request has been officially recorded in our system. Our sales team at{" "}
                        <strong>{shop.name}</strong> is reviewing your requested items and will reach out shortly.
                      </>
                    )}
                  </p>
                </div>

                {/* QUICK ACTION BUTTONS */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
                  {submittedQuote.token && (
                    <a
                      href={`/portal/invoice/${submittedQuote.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-black hover:bg-zinc-800 text-white font-mono text-xs font-bold uppercase px-5 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>🔗</span>
                      <span>View Quotation Online</span>
                    </a>
                  )}

                  {submittedQuote.token && (
                    <a
                      href={`/portal/invoice/${submittedQuote.token}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border border-zinc-300 hover:border-black bg-white hover:bg-zinc-50 text-black font-mono text-xs font-bold uppercase px-5 py-3 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <span>📄</span>
                      <span>Download PDF</span>
                    </a>
                  )}
                </div>

                {/* DIRECT MERCHANT CONTACT CARD */}
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs font-mono text-zinc-600 space-y-2 text-left">
                  <p className="font-bold text-black uppercase text-[11px]">
                    Need immediate confirmation or custom delivery?
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {shop.phone && (
                      <a
                        href={`tel:${shop.phone.replace(/[^0-9+]/g, "")}`}
                        className="hover:text-black flex items-center gap-1 text-zinc-800 font-semibold"
                      >
                        <span>📞</span>
                        <span>{shop.phone}</span>
                      </a>
                    )}
                    {shop.phone && (
                      <a
                        href={`https://wa.me/${shop.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                          `Hello ${shop.name}, I just submitted Quotation ${submittedQuote.serial} online.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline flex items-center gap-1 font-bold"
                      >
                        <span>💬</span>
                        <span>Chat on WhatsApp</span>
                      </a>
                    )}
                    {shop.email && (
                      <a
                        href={`mailto:${shop.email}`}
                        className="hover:text-black flex items-center gap-1 text-zinc-800"
                      >
                        <span>✉️</span>
                        <span>{shop.email}</span>
                      </a>
                    )}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedQuote(null);
                      setIsDrawerOpen(false);
                    }}
                    className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 rounded-xl font-mono text-xs font-bold uppercase transition-colors"
                  >
                    Done &amp; Continue Browsing
                  </button>
                </div>
              </div>
            ) : (
              /* THE USUAL REVIEW & FORM CONTENT */
              <>
                <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
                  <div>
                    <span className="font-mono text-[10px] uppercase font-bold text-zinc-400 tracking-wider block">
                      Commercial Request
                    </span>
                    <h2 className="text-xl font-bold font-sans text-black">
                      Request Formal Quotation
                    </h2>
                  </div>
                  <button
                    onClick={() => setIsDrawerOpen(false)}
                    className="text-zinc-400 hover:text-black font-mono text-xs uppercase font-bold"
                  >
                    ✕ Close
                  </button>
                </div>

                {/* SELECTED ITEMS REVIEW */}
                <div className="space-y-3">
                  <label className="font-mono text-xs uppercase font-bold text-zinc-600 block">
                    Selected Products ({selectedCount}):
                  </label>

                  <div className="divide-y divide-zinc-100 border border-zinc-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto bg-zinc-50/50">
                    {Object.values(selectedItems).map(({ product, quantity }) => (
                      <div key={product.id} className="p-3 space-y-2">
                        <div className="flex justify-between items-start gap-3">
                          <div>
                            <p className="text-xs font-bold text-black">{product.name}</p>
                            <p className="font-mono text-[10px] text-zinc-500">
                              {formatCurrency(product.unitPrice, shop.currency)} × {quantity}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-black">
                              {formatCurrency(product.unitPrice * quantity, shop.currency)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleQuantityChange(product, -quantity)}
                              className="text-rose-600 hover:text-rose-800 text-xs font-mono font-bold ml-1"
                              title="Remove item"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center p-3 bg-zinc-100 rounded-xl font-mono text-xs font-bold text-black">
                    <span>ESTIMATED TOTAL:</span>
                    <span>{formatCurrency(estimatedTotal, shop.currency)}</span>
                  </div>
                </div>

                {/* CONTACT FORM */}
                <form onSubmit={handleSubmitQuoteRequest} className="space-y-4">
                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 block">
                      Your Name / Business Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. John Doe / Acme Enterprises Ltd"
                      className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 font-sans text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 block">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => setCustomerEmail(e.target.value)}
                        placeholder="name@company.com"
                        className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-black bg-white"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 block">
                        Phone / WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        placeholder="+254 712 345 678"
                        className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-black bg-white"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-mono text-[10px] uppercase font-bold text-zinc-700 block">
                      Additional Notes / Project Requirements (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="e.g. Please include delivery to Westlands, urgent timeline..."
                      className="w-full border border-zinc-300 rounded-lg px-3.5 py-2 font-sans text-xs focus:outline-none focus:ring-2 focus:ring-black bg-white resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-zinc-200">
                    <button
                      type="button"
                      onClick={() => setIsDrawerOpen(false)}
                      disabled={isPending}
                      className="px-4 py-2.5 border border-zinc-300 rounded-lg font-mono text-xs font-bold uppercase text-zinc-700 hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isPending || selectedCount === 0}
                      className="bg-black hover:bg-zinc-800 text-white px-6 py-2.5 rounded-lg font-mono text-xs font-bold uppercase shadow-sm flex items-center gap-2 disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Spinner className="w-4 h-4 text-white" />
                          <span>Sending Request...</span>
                        </>
                      ) : (
                        <span>Submit Quote Request →</span>
                      )}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="text-center py-6 border-t border-zinc-200/80 font-mono text-xs text-zinc-400">
        <p>Powered by Manna Books Financial Platform • {shop.name}</p>
      </footer>
    </div>
  );
}
