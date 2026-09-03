"use client";

import { useState } from "react";
import Link from "next/link";
import { saveShopCurrencyAction, deleteShopCurrencyAction, syncShopCurrenciesWithLiveRatesAction, type ShopCurrencyRecord } from "@/lib/actions/currencies";
import { formatCurrency } from "@/lib/utils";
import toast from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

interface CurrencySettingsClientProps {
  shopId: string;
  shopSlug: string;
  baseCurrency: string;
  currencies: ShopCurrencyRecord[];
}

const COMMON_PRESETS = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh" },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh" },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "AU$" },
];

export function CurrencySettingsClient({
  shopId,
  shopSlug,
  baseCurrency,
  currencies,
}: CurrencySettingsClientProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [code, setCode] = useState("USD");
  const [name, setName] = useState("US Dollar");
  const [symbol, setSymbol] = useState("$");
  const [exchangeRate, setExchangeRate] = useState("129.50");
  const [isFetchingGuidance, setIsFetchingGuidance] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handlePresetSelect(presetCode: string) {
    const preset = COMMON_PRESETS.find(p => p.code === presetCode);
    if (preset) {
      setCode(preset.code);
      setName(preset.name);
      setSymbol(preset.symbol);
      fetchGuidanceRate(preset.code);
    }
  }

  async function fetchGuidanceRate(fromCode: string) {
    setIsFetchingGuidance(true);
    try {
      const res = await fetch(`/api/exchange-rate?from=${fromCode}&to=${baseCurrency}`);
      const data = await res.json();
      if (data.success && typeof data.rate === "number") {
        setExchangeRate(data.rate.toFixed(4));
        toast.success(`Fetched guidance rate: 1 ${fromCode} = ${data.rate.toFixed(4)} ${baseCurrency}`);
      }
    } catch {
      toast.error("Could not fetch live rate. Please enter manually.");
    } finally {
      setIsFetchingGuidance(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const rateNum = parseFloat(exchangeRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error("Please enter a valid exchange rate greater than 0.");
      return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Saving currency rate...");

    try {
      const res = await saveShopCurrencyAction({
        shopId,
        shopSlug,
        code,
        name,
        symbol,
        exchangeRate: rateNum,
        isEnabled: true,
      });

      if (res.success) {
        toast.success(`Saved ${code} exchange rate successfully!`, { id: toastId });
        setIsAdding(false);
        setEditingId(null);
      } else {
        toast.error(res.error || "Failed to save currency.", { id: toastId });
      }
    } catch {
      toast.error("Error saving currency settings.", { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggle(curr: ShopCurrencyRecord) {
    const toastId = toast.loading(`${curr.isEnabled ? "Disabling" : "Enabling"} ${curr.code}...`);
    const res = await saveShopCurrencyAction({
      shopId,
      shopSlug,
      code: curr.code,
      name: curr.name,
      symbol: curr.symbol,
      exchangeRate: parseFloat(curr.exchangeRate),
      isEnabled: !curr.isEnabled,
    });
    if (res.success) {
      toast.success(`${curr.code} ${!curr.isEnabled ? "enabled" : "disabled"} for billing!`, { id: toastId });
    } else {
      toast.error("Failed to update status.", { id: toastId });
    }
  }

  async function handleDelete(curr: ShopCurrencyRecord) {
    if (!confirm(`Are you sure you want to remove ${curr.code} from your currency portfolio?`)) return;
    const toastId = toast.loading(`Deleting ${curr.code}...`);
    const res = await deleteShopCurrencyAction({
      shopId,
      shopSlug,
      currencyId: curr.id,
    });
    if (res.success) {
      toast.success(`Removed ${curr.code} from portfolio.`, { id: toastId });
    } else {
      toast.error("Failed to delete currency.", { id: toastId });
    }
  }

  async function handleSyncAllWithLiveRates() {
    setIsSyncingAll(true);
    const toastId = toast.loading("Syncing all currencies with live market rates...");
    try {
      const res = await syncShopCurrenciesWithLiveRatesAction({
        shopId,
        shopSlug,
        baseCurrency,
      });
      if (res.success) {
        toast.success(`Synced ${res.updatedCount} currencies with live market rates!`, { id: toastId });
      } else {
        toast.error(res.error || "Failed to sync rates.", { id: toastId });
      }
    } catch {
      toast.error("Network error syncing rates.", { id: toastId });
    } finally {
      setIsSyncingAll(false);
    }
  }

  return (
    <div className="space-y-8 font-mono text-xs selection:bg-black selection:text-white">
      {/* HEADER TOP BAR */}
      <div className="space-y-2">
        <Link
          href={`/workspaces/${shopSlug}/settings`}
          className="font-sans text-xs font-bold text-zinc-400 hover:underline block"
        >
          ← Back to Workspace Settings
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="text-xs text-zinc-400 font-medium">
              Financial Configuration
            </span>
            <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">
              Multi-Currency &amp; Exchange Rates
            </h1>
            <p className="text-xs text-zinc-500 font-sans mt-0.5">
              Predefine fixed commercial exchange rates against your base currency ({baseCurrency}). These auto-populate whenever creating invoices and quotes.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSyncingAll || currencies.length === 0}
              onClick={handleSyncAllWithLiveRates}
              className="px-3.5 py-2 border border-zinc-300 bg-white hover:bg-zinc-50 rounded-lg text-xs font-bold uppercase transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSyncingAll ? (
                <>
                  <Spinner size={12} />
                  <span>Syncing...</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Sync Live Market Rates</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAdding(true);
                setCode("USD");
                setName("US Dollar");
                setSymbol("$");
                fetchGuidanceRate("USD");
              }}
              className="btn-primary-modern px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider"
            >
              + Add Currency
            </button>
          </div>
        </div>
      </div>

      {/* BASE CURRENCY SUMMARY CARD */}
      <div className="bg-zinc-50 border border-zinc-200/80 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] text-zinc-400 uppercase font-bold block">Primary Operating Base Currency</span>
          <p className="text-base font-bold text-black font-sans mt-0.5">
            {baseCurrency} — All foreign currency documents are converted to {baseCurrency} in your general ledger.
          </p>
        </div>
        <div className="badge-black text-[11px] px-3 py-1 font-semibold">
          Base: 1.0000 {baseCurrency}
        </div>
      </div>

      {/* ADD / EDIT MODAL */}
      {isAdding && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <form
            onSubmit={handleSave}
            className="bg-white border border-zinc-300 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl font-mono text-xs text-left"
          >
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-bold block">Currency Setup</span>
                <h3 className="font-bold text-sm uppercase text-black font-sans">
                  Configure Foreign Currency
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="text-zinc-400 hover:text-black font-bold text-base"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* PRESETS QUICK PICK */}
              <div>
                <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                  Quick Select Preset
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_PRESETS.filter(p => p.code !== baseCurrency).map(p => (
                    <button
                      key={p.code}
                      type="button"
                      onClick={() => handlePresetSelect(p.code)}
                      className={`px-2 py-1 rounded text-[10px] uppercase font-bold border transition-colors ${
                        code === p.code
                          ? "badge-emerald"
                          : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:border-zinc-400"
                      }`}
                    >
                      {p.code}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                    Code *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. USD"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs uppercase font-bold focus:outline-none focus:border-black"
                  />
                </div>

                <div className="col-span-2">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-500 block mb-1">
                    Currency Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. US Dollar"
                    className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-sans focus:outline-none focus:border-black"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-mono text-[10px] uppercase font-bold text-zinc-500">
                    Predefined Exchange Rate (1 {code || "FX"} = ? {baseCurrency}) *
                  </label>
                  <button
                    type="button"
                    disabled={isFetchingGuidance}
                    onClick={() => fetchGuidanceRate(code)}
                    className="text-[10px] text-blue-600 hover:underline font-bold uppercase"
                  >
                    {isFetchingGuidance ? "Fetching..." : "⚡ Live Market Rate"}
                  </button>
                </div>
                <input
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  required
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(e.target.value)}
                  placeholder="e.g. 129.5000"
                  className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-sm font-bold focus:outline-none focus:border-black"
                />
                <p className="text-[10px] text-zinc-500 font-sans mt-1">
                  Example: Invoicing {symbol} 1,000.00 will convert to {formatCurrency(1000 * (parseFloat(exchangeRate) || 1), baseCurrency)} in reports.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="btn-secondary-modern px-3.5 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !code || !exchangeRate}
                className="btn-primary-modern px-3.5 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Spinner size={10} color="white" />
                    <span>Saving...</span>
                  </>
                ) : (
                  "Save Currency"
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* CURRENCIES TABLE */}
      <div className="card-modern overflow-x-auto bg-white">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
              <th className="px-4 py-3 border-r border-zinc-100">Currency</th>
              <th className="px-4 py-3 border-r border-zinc-100">Code &amp; Symbol</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-right">Fixed Exchange Rate</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-right">100 Unit Value</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-center">Status</th>
              <th className="px-4 py-3 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {currencies.map((curr) => {
              const rateNum = parseFloat(curr.exchangeRate);
              return (
                <tr key={curr.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                  <td className="p-4 border-r border-zinc-100 font-bold text-black font-sans text-sm">
                    {curr.name}
                  </td>
                  <td className="p-4 border-r border-zinc-100">
                    <span className="bg-zinc-100 text-zinc-800 border border-zinc-200 px-2 py-0.5 rounded font-bold uppercase text-[10px]">
                      {curr.code} ({curr.symbol})
                    </span>
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-right font-black text-black">
                    1 {curr.code} = {rateNum.toFixed(4)} {baseCurrency}
                  </td>
                  <td className="p-4 border-r border-zinc-100 text-right text-zinc-600">
                    {formatCurrency(100 * rateNum, baseCurrency)}
                  </td>
                  <td className="px-4 py-3 border-r border-zinc-100 text-center">
                    <button
                      type="button"
                      onClick={() => handleToggle(curr)}
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase cursor-pointer transition-colors ${
                        curr.isEnabled
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                      }`}
                    >
                      {curr.isEnabled ? "✓ Active" : "Disabled"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setCode(curr.code);
                          setName(curr.name);
                          setSymbol(curr.symbol);
                          setExchangeRate(curr.exchangeRate);
                          setIsAdding(true);
                        }}
                        className="text-zinc-600 hover:text-black font-bold uppercase text-[10px]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(curr)}
                        className="text-rose-600 hover:text-rose-800 font-bold uppercase text-[10px]"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {currencies.length === 0 && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-zinc-400 italic">
                  No foreign currencies configured yet. Click &quot;+ Add Currency&quot; to define exchange rates.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
