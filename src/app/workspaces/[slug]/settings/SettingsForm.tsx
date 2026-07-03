// src/app/workspaces/[slug]/settings/SettingsForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateShopSettings } from "@/lib/actions/workspace";
import { addPaymentMethod } from "@/lib/actions/payments";
import { toast } from "react-hot-toast";

interface PaymentMethod {
  id: string;
  name: string;
  details: string;
  isDefault: boolean;
}

interface SettingsFormProps {
  shopId: string;
  shopSlug: string;
  initialName: string;
  initialLogoUrl?: string;
  initialTaxPin: string;
  initialIsVatRegistered: boolean;
  initialCurrency: string;
  paymentMethods: PaymentMethod[];
}

export function SettingsForm({
  shopId,
  shopSlug,
  initialName,
  initialLogoUrl = "",
  initialTaxPin,
  initialIsVatRegistered,
  initialCurrency,
  paymentMethods: initialMethods,
}: SettingsFormProps) {
  const router = useRouter();

  // Profile form state
  const [businessName, setBusinessName] = useState(initialName);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [taxPin, setTaxPin] = useState(initialTaxPin);
  const [isVatRegistered, setIsVatRegistered] = useState(initialIsVatRegistered);
  const [currency, setCurrency] = useState(initialCurrency);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Payment method form state
  const [pmName, setPmName] = useState("");
  const [pmDetails, setPmDetails] = useState("");
  const [pmDefault, setPmDefault] = useState(false);
  const [addingPm, setAddingPm] = useState(false);
  const [pmMsg, setPmMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileMsg(null);
    setSaving(true);
    const toastId = toast.loading("Saving configuration...");

    if (isVatRegistered && !taxPin) {
      const text = "A registered Tax PIN is required when VAT is active.";
      setProfileMsg({ type: "error", text });
      toast.error(text, { id: toastId });
      setSaving(false);
      return;
    }

    const res = await updateShopSettings({ shopId, name: businessName, logoUrl, taxPin, isVatRegistered, currency });
    setSaving(false);
    if (res.success) {
      const text = "Configuration committed successfully.";
      setProfileMsg({ type: "success", text });
      toast.success(text, { id: toastId });
      router.refresh();
    } else {
      const text = res.error || "Execution failed.";
      setProfileMsg({ type: "error", text });
      toast.error(text, { id: toastId });
    }
  }

  async function handleAddPaymentMethod(e: React.FormEvent) {
    e.preventDefault();
    setPmMsg(null);
    setAddingPm(true);
    const toastId = toast.loading("Adding payment method...");

    const res = await addPaymentMethod({ shopId, shopSlug, name: pmName, details: pmDetails, isDefault: pmDefault });
    setAddingPm(false);

    if (res.success) {
      const text = "Payment method added.";
      setPmMsg({ type: "success", text });
      toast.success(text, { id: toastId });
      setPmName("");
      setPmDetails("");
      setPmDefault(false);
      router.refresh();
    } else {
      const text = res.error || "Failed to save payment method.";
      setPmMsg({ type: "error", text });
      toast.error(text, { id: toastId });
    }
  }

  return (
    <div className="space-y-8">
      {/* ── BUSINESS PROFILE FORM ── */}
      <form onSubmit={handleProfileSubmit} className="space-y-6 font-mono text-xs border border-black p-6 bg-white">
        <h2 className="font-bold uppercase tracking-wider text-sm">Business Profile</h2>

        {profileMsg && (
          <div className={`border p-3 font-bold uppercase text-xs ${
            profileMsg.type === "success"
              ? "border-black bg-black text-white"
              : "border-black bg-zinc-50 text-black"
          }`}>
            &gt; {profileMsg.text}
          </div>
        )}

        <div className="space-y-1">
          <label className="text-zinc-400 uppercase block">Trading Profile Name</label>
          <input
            type="text"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none"
            required
          />
        </div>

        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <label className="text-zinc-400 uppercase block">Brand Logo Asset URL</label>
            <span className="text-[9px] text-zinc-400 font-mono italic">Optional</span>
          </div>
          <input
            type="url"
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
            placeholder="https://domain.com/assets/logo.png"
            className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none font-mono"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-zinc-400 uppercase block">Operating Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-none"
            >
              <option value="KES">KES — Kenya Shilling</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="TZS">TZS — Tanzanian Shilling</option>
              <option value="UGX">UGX — Ugandan Shilling</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 uppercase block">Statutory Corporate PIN (KRA PIN)</label>
            <input
              type="text"
              value={taxPin}
              onChange={(e) => setTaxPin(e.target.value)}
              placeholder="e.g., P0511XXXXXXZ"
              className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 uppercase rounded-none"
            />
          </div>
        </div>

        <div className="border-t border-dashed border-zinc-200 pt-4 flex items-start gap-3">
          <input
            type="checkbox"
            id="vatActive"
            checked={isVatRegistered}
            onChange={(e) => setIsVatRegistered(e.target.checked)}
            className="w-4 h-4 border border-black accent-black rounded-none mt-0.5 cursor-pointer"
          />
          <div className="space-y-1">
            <label htmlFor="vatActive" className="font-bold uppercase tracking-tight block cursor-pointer select-none">
              This entity is officially VAT registered
            </label>
            <p className="font-sans text-[11px] text-zinc-500 normal-case leading-tight">
              When checked, the document compiler automatically applies the statutory 16% VAT layer on all billing items
              not explicitly marked as Exempt or Zero-Rated.
            </p>
          </div>
        </div>

        <div className="border-t border-black pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-black text-white px-6 py-2.5 font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors disabled:bg-zinc-300 rounded-none"
          >
            {saving ? "SAVING..." : "COMMIT CHANGES"}
          </button>
        </div>
      </form>

      {/* ── PAYMENT METHODS ── */}
      <div className="border border-black bg-white">
        <div className="p-6 border-b border-black space-y-1">
          <h2 className="font-mono font-bold uppercase tracking-wider text-sm">Payment Methods</h2>
          <p className="font-sans text-xs text-zinc-500 normal-case">
            These appear on client-facing invoices as remittance instructions.
          </p>
        </div>

        {/* Existing Methods List */}
        {initialMethods.length > 0 && (
          <div className="divide-y divide-black border-b border-black">
            {initialMethods.map((pm) => (
              <div key={pm.id} className="p-4 flex justify-between items-start font-mono text-xs">
                <div>
                  <span className="font-bold uppercase">{pm.name}</span>
                  {pm.isDefault && (
                    <span className="ml-2 bg-black text-white px-1.5 py-0.5 text-[9px] font-bold uppercase">DEFAULT</span>
                  )}
                  <p className="text-zinc-500 mt-0.5">{pm.details}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {initialMethods.length === 0 && (
          <div className="p-6 font-mono text-xs text-zinc-400 italic">
            &gt; No payment methods configured. Add one below.
          </div>
        )}

        {/* Add New Method Form */}
        <form onSubmit={handleAddPaymentMethod} className="p-6 space-y-4 font-mono text-xs bg-zinc-50">
          <p className="text-[10px] text-zinc-400 uppercase font-bold">Add New Payment Method</p>

          {pmMsg && (
            <div className={`border p-3 font-bold uppercase text-xs ${
              pmMsg.type === "success" ? "border-black bg-black text-white" : "border-black bg-white text-black"
            }`}>
              &gt; {pmMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-zinc-400 uppercase block">Method Name</label>
              <input
                type="text"
                value={pmName}
                onChange={(e) => setPmName(e.target.value)}
                placeholder="e.g., M-Pesa Till"
                className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-zinc-400 uppercase block">Account Details / Instructions</label>
              <input
                type="text"
                value={pmDetails}
                onChange={(e) => setPmDetails(e.target.value)}
                placeholder="e.g., Till: 552134 | Acc: Manna Store"
                className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-none"
                required
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pmDefault"
              checked={pmDefault}
              onChange={(e) => setPmDefault(e.target.checked)}
              className="w-4 h-4 border border-black accent-black rounded-none cursor-pointer"
            />
            <label htmlFor="pmDefault" className="cursor-pointer select-none uppercase">Set as default method</label>
          </div>

          <button
            type="submit"
            disabled={addingPm}
            className="border border-black bg-black text-white px-5 py-2 font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors disabled:bg-zinc-300 rounded-none"
          >
            {addingPm ? "ADDING..." : "+ Add Method"}
          </button>
        </form>
      </div>
    </div>
  );
}
