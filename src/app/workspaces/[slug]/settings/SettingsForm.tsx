// src/app/workspaces/[slug]/settings/SettingsForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateShopSettings } from "@/lib/actions/workspace";
import { useAddPaymentMethod, useDeletePaymentMethod, useSetDefaultPaymentMethod } from "@/hooks/usePayments";
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
  const [pmCategory, setPmCategory] = useState<"BANK" | "TILL" | "PAYBILL" | "CUSTOM">("BANK");
  const [bankName, setBankName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [swiftCode, setSwiftCode] = useState("");

  const [tillNumber, setTillNumber] = useState("");
  const [storeName, setStoreName] = useState("");

  const [paybillNumber, setPaybillNumber] = useState("");
  const [accountRef, setAccountRef] = useState("");

  const [customName, setCustomName] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  const [pmDefault, setPmDefault] = useState(false);
  const [pmMsg, setPmMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addPaymentMutation = useAddPaymentMethod(shopId, shopSlug);
  const deletePaymentMutation = useDeletePaymentMethod(shopId, shopSlug);
  const setDefaultPaymentMutation = useSetDefaultPaymentMethod(shopId, shopSlug);

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

    let name = "";
    let details = "";

    if (pmCategory === "BANK") {
      if (!bankName || !accountName || !accountNumber) {
        toast.error("Bank Name, Account Name, and Account Number are required.");
        return;
      }
      name = `${bankName.trim()} Account`;
      details = `Bank: ${bankName.trim()} | Acc Name: ${accountName.trim()} | Acc No: ${accountNumber.trim()}${branchName.trim() ? ` | Branch: ${branchName.trim()}` : ''}${swiftCode.trim() ? ` | SWIFT: ${swiftCode.trim().toUpperCase()}` : ''}`;
    } else if (pmCategory === "TILL") {
      if (!tillNumber) {
        toast.error("Till Number is required.");
        return;
      }
      name = `M-Pesa Buy Goods (Till ${tillNumber.trim()})`;
      details = `Till Number: ${tillNumber.trim()}${storeName.trim() ? ` | Store Name: ${storeName.trim()}` : ''}`;
    } else if (pmCategory === "PAYBILL") {
      if (!paybillNumber) {
        toast.error("Paybill Business Number is required.");
        return;
      }
      name = `M-Pesa Paybill (${paybillNumber.trim()})`;
      details = `Paybill / Business No: ${paybillNumber.trim()}${accountRef.trim() ? ` | Account Ref: ${accountRef.trim()}` : ''}`;
    } else {
      if (!customName || !customInstructions) {
        toast.error("Custom Method Name and Instructions are required.");
        return;
      }
      name = customName.trim();
      details = customInstructions.trim();
    }

    addPaymentMutation.mutate(
      { name, details, isDefault: pmDefault },
      {
        onSuccess: () => {
          setBankName("");
          setBranchName("");
          setAccountName("");
          setAccountNumber("");
          setSwiftCode("");
          setTillNumber("");
          setStoreName("");
          setPaybillNumber("");
          setAccountRef("");
          setCustomName("");
          setCustomInstructions("");
          setPmDefault(false);
          router.refresh();
        },
      }
    );
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
              <div key={pm.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold uppercase">{pm.name}</span>
                    {pm.isDefault && (
                      <span className="bg-black text-white px-1.5 py-0.5 text-[9px] font-bold uppercase">DEFAULT</span>
                    )}
                  </div>
                  <p className="text-zinc-500 mt-1 text-[11px] font-mono leading-relaxed">{pm.details}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!pm.isDefault && (
                    <button
                      type="button"
                      onClick={() => {
                        setDefaultPaymentMutation.mutate(pm.id, {
                          onSuccess: () => router.refresh(),
                        });
                      }}
                      className="border border-zinc-300 text-zinc-600 px-2 py-1 text-[10px] font-bold uppercase hover:border-black hover:text-black transition-colors"
                    >
                      Make Default
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!confirm(`Are you sure you want to delete "${pm.name}"?`)) return;
                      deletePaymentMutation.mutate(pm.id, {
                        onSuccess: () => router.refresh(),
                      });
                    }}
                    className="border border-rose-600 text-rose-600 px-2 py-1 text-[10px] font-bold uppercase hover:bg-rose-600 hover:text-white transition-colors"
                  >
                    Delete
                  </button>
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
        <form onSubmit={handleAddPaymentMethod} className="p-6 space-y-6 font-mono text-xs bg-zinc-50 border-t border-black">
          <div className="space-y-1">
            <p className="text-[10px] text-zinc-400 uppercase font-bold">Add New Payment Method</p>
            <p className="font-sans text-xs text-zinc-500">Select payment type to configure structured remittance details.</p>
          </div>

          {/* Category Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: "BANK", label: "Bank Account" },
              { id: "TILL", label: "M-Pesa Till" },
              { id: "PAYBILL", label: "M-Pesa Paybill" },
              { id: "CUSTOM", label: "Custom Instructions" },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setPmCategory(cat.id as any)}
                className={`py-2 px-3 text-[11px] font-bold uppercase border transition-colors ${
                  pmCategory === cat.id
                    ? "bg-black text-white border-black"
                    : "bg-white text-zinc-600 border-zinc-300 hover:border-black hover:text-black"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* BANK ACCOUNT FIELDS */}
          {pmCategory === "BANK" && (
            <div className="space-y-4 border border-black p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Bank Name *</label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    placeholder="e.g., NCBA Bank / KCB"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Branch Name</label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g., Kilimani Branch"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Account Name / Title *</label>
                  <input
                    type="text"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    placeholder="e.g., Ventures of Africa LTD"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Account Number *</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g., 01108239101"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">SWIFT / BIC Code (Optional)</label>
                <input
                  type="text"
                  value={swiftCode}
                  onChange={(e) => setSwiftCode(e.target.value)}
                  placeholder="e.g., NCBAKE22"
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 uppercase"
                />
              </div>
            </div>
          )}

          {/* M-PESA TILL FIELDS */}
          {pmCategory === "TILL" && (
            <div className="space-y-4 border border-black p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Buy Goods Till Number *</label>
                  <input
                    type="text"
                    value={tillNumber}
                    onChange={(e) => setTillNumber(e.target.value)}
                    placeholder="e.g., 552134"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 font-bold text-base"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Store / Merchant Name</label>
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g., Ventures of Africa"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* M-PESA PAYBILL FIELDS */}
          {pmCategory === "PAYBILL" && (
            <div className="space-y-4 border border-black p-4 bg-white">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Business / Paybill Number *</label>
                  <input
                    type="text"
                    value={paybillNumber}
                    onChange={(e) => setPaybillNumber(e.target.value)}
                    placeholder="e.g., 247247"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 font-bold text-base"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Account Ref / Instructions</label>
                  <input
                    type="text"
                    value={accountRef}
                    onChange={(e) => setAccountRef(e.target.value)}
                    placeholder="e.g., Invoice Number / Client Name"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300"
                  />
                </div>
              </div>
            </div>
          )}

          {/* CUSTOM INSTRUCTIONS FIELDS */}
          {pmCategory === "CUSTOM" && (
            <div className="space-y-4 border border-black p-4 bg-white">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">Method Title *</label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g., PayPal / Cash / Cheque"
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 font-bold"
                  required
                />
              </div>
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">Payment Instructions *</label>
                <textarea
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value)}
                  placeholder="e.g., Send PayPal payment to billing@domain.com or issue cheque to Ventures of Africa LTD."
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 h-20"
                  required
                ></textarea>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="pmDefault"
              checked={pmDefault}
              onChange={(e) => setPmDefault(e.target.checked)}
              className="w-4 h-4 border border-black accent-black rounded-none cursor-pointer"
            />
            <label htmlFor="pmDefault" className="cursor-pointer select-none uppercase font-bold">
              Set as default payment method on invoices
            </label>
          </div>

          <button
            type="submit"
            disabled={addPaymentMutation.isPending}
            className="border border-black bg-black text-white px-6 py-2.5 font-bold uppercase tracking-wider hover:bg-zinc-900 transition-colors disabled:bg-zinc-300 rounded-none w-full sm:w-auto"
          >
            {addPaymentMutation.isPending ? "SAVING..." : "+ SAVE PAYMENT METHOD"}
          </button>
        </form>
      </div>
    </div>
  );
}
