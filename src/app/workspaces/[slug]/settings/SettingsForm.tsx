// src/app/workspaces/[slug]/settings/SettingsForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateShopSettings } from "@/lib/actions/workspace";
import { repairLedgerAction } from "@/lib/actions/documents";
import { useAddPaymentMethod, useDeletePaymentMethod, useSetDefaultPaymentMethod, useUpdatePaymentMethod } from "@/hooks/usePayments";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

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
  initialShortName?: string;
  initialPhone?: string;
  initialWebsite?: string;
  initialPrimaryColor?: string;
  initialLogoUrl?: string;
  initialTaxPin: string;
  initialEmail?: string;
  initialIsVatRegistered: boolean;
  initialVatNumber?: string;
  initialCurrency: string;
  initialFiscalYearStartMonth: number;
  paymentMethods: PaymentMethod[];
}

const COLOR_PALETTES = [
  { name: "Obsidian Black", hex: "#000000" },
  { name: "Navy Blue", hex: "#1e3a8a" },
  { name: "Emerald Green", hex: "#065f46" },
  { name: "Crimson Red", hex: "#991b1b" },
  { name: "Royal Purple", hex: "#581c87" },
  { name: "Teal", hex: "#0f766e" },
  { name: "Amber Bronze", hex: "#92400e" },
];

export function SettingsForm({
  shopId,
  shopSlug,
  initialName,
  initialShortName = "",
  initialPhone = "",
  initialWebsite = "",
  initialPrimaryColor = "#000000",
  initialLogoUrl = "",
  initialTaxPin,
  initialEmail = "",
  initialIsVatRegistered,
  initialVatNumber = "",
  initialCurrency,
  initialFiscalYearStartMonth = 1,
  paymentMethods: initialMethods,
}: SettingsFormProps) {
  const router = useRouter();

  // Ledger repair state
  const [repairing, setRepairing] = useState(false);
  const [showRebuildConfirm, setShowRebuildConfirm] = useState(false);

  async function handleRebuildLedger() {
    setShowRebuildConfirm(false);
    setRepairing(true);
    const toastId = toast.loading("Rebuilding ledger journal entries...");
    try {
      const res = await repairLedgerAction(shopId, shopSlug);
      if (res.success) {
        toast.success("Ledger journal entries successfully rebuilt and repaired.", { id: toastId });
        router.refresh();
      } else {
        toast.error(res.error || "Failed to repair ledger.", { id: toastId });
      }
    } catch (err) {
      toast.error("An unexpected error occurred during ledger repair.", { id: toastId });
    } finally {
      setRepairing(false);
    }
  }

  // Profile form state
  const [businessName, setBusinessName] = useState(initialName);
  const [shortName, setShortName] = useState(initialShortName);
  const [phone, setPhone] = useState(initialPhone);
  const [email, setEmail] = useState(initialEmail);
  const [website, setWebsite] = useState(initialWebsite);
  const [primaryColor, setPrimaryColor] = useState(initialPrimaryColor);
  const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
  const [taxPin, setTaxPin] = useState(initialTaxPin);
  const [isVatRegistered, setIsVatRegistered] = useState(initialIsVatRegistered);
  const [vatNumber, setVatNumber] = useState(initialVatNumber);
  const [currency, setCurrency] = useState(initialCurrency);
  const [fiscalYearStartMonth, setFiscalYearStartMonth] = useState(initialFiscalYearStartMonth);
  const [saving, setSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deletingPmId, setDeletingPmId] = useState<string | null>(null);

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

  // Edit payment method state
  const [editingPm, setEditingPm] = useState<PaymentMethod | null>(null);
  const [editName, setEditName] = useState("");
  const [editDetails, setEditDetails] = useState("");
  const [editDefault, setEditDefault] = useState(false);

  const addPaymentMutation = useAddPaymentMethod(shopId, shopSlug);
  const deletePaymentMutation = useDeletePaymentMethod(shopId, shopSlug);
  const setDefaultPaymentMutation = useSetDefaultPaymentMethod(shopId, shopSlug);
  const updatePaymentMutation = useUpdatePaymentMethod(shopId, shopSlug);

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

    if (isVatRegistered && !vatNumber.trim()) {
      const text = "A VAT Registration Number is required when VAT is active.";
      setProfileMsg({ type: "error", text });
      toast.error(text, { id: toastId });
      setSaving(false);
      return;
    }

    const res = await updateShopSettings({
      shopId,
      name: businessName,
      shortName,
      phone,
      website,
      primaryColor,
      logoUrl,
      taxPin,
      email,
      isVatRegistered,
      vatNumber: vatNumber.trim() || undefined,
      currency,
      fiscalYearStartMonth,
    });
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
      details = `Bank: ${bankName.trim()}\nAcc Name: ${accountName.trim()}\nAcc No: ${accountNumber.trim()}${branchName.trim() ? `\nBranch: ${branchName.trim()}` : ''}${swiftCode.trim() ? `\nSWIFT: ${swiftCode.trim().toUpperCase()}` : ''}`;
    } else if (pmCategory === "TILL") {
      if (!tillNumber) {
        toast.error("Till Number is required.");
        return;
      }
      name = `M-Pesa Buy Goods (Till ${tillNumber.trim()})`;
      details = `Till Number: ${tillNumber.trim()}${storeName.trim() ? `\nStore Name: ${storeName.trim()}` : ''}`;
    } else if (pmCategory === "PAYBILL") {
      if (!paybillNumber) {
        toast.error("Paybill Business Number is required.");
        return;
      }
      name = `M-Pesa Paybill (${paybillNumber.trim()})`;
      details = `Paybill / Business No: ${paybillNumber.trim()}${accountRef.trim() ? `\nAccount Ref: ${accountRef.trim()}` : ''}`;
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

  async function handleEditPaymentMethod(e: React.FormEvent) {
    e.preventDefault();
    if (!editingPm) return;
    if (!editName.trim() || !editDetails.trim()) {
      toast.error("Name and Details/Instructions are required.");
      return;
    }
    updatePaymentMutation.mutate(
      { id: editingPm.id, name: editName.trim(), details: editDetails.trim(), isDefault: editDefault },
      {
        onSuccess: () => {
          setEditingPm(null);
          setEditName("");
          setEditDetails("");
          setEditDefault(false);
          router.refresh();
        }
      }
    );
  }

  const [uploadingLogo, setUploadingLogo] = useState(false);

  async function handleCloudinaryUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      toast.error("Cloudinary is not configured. Please set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local, or paste a direct image URL.");
      return;
    }

    setUploadingLogo(true);
    const toastId = toast.loading("Uploading logo asset to Cloudinary...");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setUploadingLogo(false);

      if (data.secure_url) {
        setLogoUrl(data.secure_url);
        toast.success("Logo uploaded successfully!", { id: toastId });
      } else {
        const errorMsg = data.error?.message || "Cloudinary upload failed.";
        toast.error(errorMsg, { id: toastId });
      }
    } catch (err) {
      setUploadingLogo(false);
      toast.error("Network error uploading to Cloudinary.", { id: toastId });
    }
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      {/* ── BUSINESS PROFILE FORM ── */}
      <form onSubmit={handleProfileSubmit} className="space-y-6 font-mono text-xs card-modern p-6 bg-white">
        <h2 className="font-semibold uppercase tracking-wider text-sm text-black font-sans">Business Profile</h2>

        {profileMsg && (
          <div className={`border p-3 font-semibold uppercase text-xs rounded ${
            profileMsg.type === "success"
              ? "border-black bg-black text-white"
              : "border-zinc-200 bg-zinc-50 text-black"
          }`}>
            &gt; {profileMsg.text}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-zinc-400 uppercase block font-semibold">Trading Legal Name</label>
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 uppercase block font-semibold">Short Alias / Trading Name</label>
            <input
              type="text"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              placeholder="e.g. Corban Tech"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-zinc-400 uppercase block font-semibold">Business Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. +254 712 345"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 uppercase block font-semibold">Business Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="billing@company.com"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs font-mono"
            />
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 uppercase block font-semibold">Website URL</label>
            <input
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://company.org"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded font-mono text-[11px]"
            />
          </div>
        </div>

        {/* SHOP PRIMARY THEME COLOR SELECTOR */}
        <div className="border border-zinc-200 p-4 bg-zinc-50/50 rounded space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-semibold uppercase text-black text-xs block">Shop Brand Theme Color</span>
              <span className="text-[10px] text-zinc-500 font-sans normal-case block">
                Replaces default black across your workspace, client portals, PDFs, and transactional emails.
              </span>
            </div>
            <div
              className="w-7 h-7 border border-zinc-300 rounded shadow-sm shrink-0"
              style={{ backgroundColor: primaryColor || "#000000" }}
              title={`Current Theme: ${primaryColor}`}
            />
          </div>

          {/* Preset Swatches */}
          <div className="flex flex-wrap gap-2 pt-1">
            {COLOR_PALETTES.map((c) => (
              <button
                key={c.hex}
                type="button"
                onClick={() => setPrimaryColor(c.hex)}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase border rounded transition-colors ${
                  primaryColor.toLowerCase() === c.hex.toLowerCase()
                    ? "border-black bg-black text-white"
                    : "border-zinc-300 bg-white text-zinc-700 hover:border-black"
                }`}
              >
                <span className="w-3 h-3 border border-black/20 rounded-sm" style={{ backgroundColor: c.hex }} />
                {c.name}
              </button>
            ))}
          </div>

          {/* Custom Hex Code Input */}
          <div className="flex items-center gap-2 pt-1">
            <span className="text-[10px] font-semibold text-zinc-500 uppercase">Custom Hex Code:</span>
            <input
              type="color"
              value={primaryColor.startsWith("#") && primaryColor.length === 7 ? primaryColor : "#000000"}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-8 h-8 p-0 border border-zinc-300 cursor-pointer bg-white rounded"
            />
            <input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              placeholder="#000000"
              maxLength={7}
              className="w-28 px-2 py-1 border border-zinc-300 bg-white text-xs uppercase font-mono font-semibold rounded"
            />
          </div>
        </div>

        {/* LOGO UPLOAD & URL FIELD */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-zinc-400 uppercase block font-semibold">Brand Logo Asset</label>
            <span className="text-[9px] text-zinc-400 font-mono italic">Cloudinary Enabled</span>
          </div>

          {logoUrl && (
            <div className="flex items-center gap-4 p-3 border border-zinc-200 bg-zinc-50 rounded">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={logoUrl} alt="Shop Logo Preview" className="h-12 w-auto max-w-[120px] object-contain border border-zinc-200 bg-white p-1 rounded" />
              <div className="space-y-1">
                <p className="text-[10px] font-semibold text-black uppercase">Active Logo Loaded</p>
                <button
                  type="button"
                  onClick={() => setLogoUrl("")}
                  className="text-[10px] text-rose-600 font-semibold uppercase underline hover:no-underline"
                >
                  Remove Logo
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <label className="btn-primary-modern px-3 py-2 text-[11px] font-semibold uppercase tracking-wider cursor-pointer text-center shrink-0 flex items-center justify-center gap-1.5">
              {uploadingLogo ? (
                <>
                  <Spinner size={10} color="white" />
                  <span>UPLOADING...</span>
                </>
              ) : (
                "📷 Upload Logo File"
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleCloudinaryUpload}
                disabled={uploadingLogo}
                className="hidden"
              />
            </label>

            <input
              type="url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="Or paste direct image URL (https://...)"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded font-mono text-[11px]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-zinc-400 uppercase block font-semibold">Operating Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
            >
              <option value="KES">KES — Kenya Shilling</option>
              <option value="USD">USD — US Dollar</option>
              <option value="EUR">EUR — Euro</option>
              <option value="TZS">TZS — Tanzanian Shilling</option>
              <option value="UGX">UGX — Ugandan Shilling</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-zinc-400 uppercase block font-semibold">Statutory Corporate PIN (KRA PIN)</label>
            <input
              type="text"
              value={taxPin}
              onChange={(e) => setTaxPin(e.target.value)}
              placeholder="e.g., P0511XXXXXXZ"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 uppercase rounded text-xs font-mono"
            />
          </div>
        </div>

        {/* FISCAL YEAR SETTING */}
        <div className="border border-zinc-200 p-4 bg-zinc-50/50 rounded space-y-3">
          <span className="font-semibold uppercase text-black text-xs block">Fiscal Year Start Month</span>
          <span className="text-[10px] text-zinc-500 font-sans normal-case block">
            Defines the start of your 12-month accounting cycle. Used for analytics and invoice serial numbering.
          </span>
          <select
            value={fiscalYearStartMonth}
            onChange={(e) => setFiscalYearStartMonth(parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
          >
            <option value={1}>January (Calendar Year default)</option>
            <option value={2}>February</option>
            <option value={3}>March</option>
            <option value={4}>April</option>
            <option value={5}>May</option>
            <option value={6}>June</option>
            <option value={7}>July (Government of Kenya standard)</option>
            <option value={8}>August</option>
            <option value={9}>September</option>
            <option value={10}>October</option>
            <option value={11}>November</option>
            <option value={12}>December</option>
          </select>
        </div>

        <div className="border-t border-dashed border-zinc-200 pt-4 space-y-4">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="vatActive"
              checked={isVatRegistered}
              onChange={(e) => setIsVatRegistered(e.target.checked)}
              className="w-4 h-4 border border-zinc-300 accent-black rounded-sm mt-0.5 cursor-pointer"
            />
            <div className="space-y-1">
              <label htmlFor="vatActive" className="font-semibold uppercase tracking-tight block cursor-pointer select-none">
                This entity is officially VAT registered
              </label>
              <p className="font-sans text-[11px] text-zinc-500 normal-case leading-tight">
                When checked, the document compiler automatically applies the statutory 16% VAT layer on all billing items
                not explicitly marked as Exempt or Zero-Rated.
              </p>
            </div>
          </div>

          {isVatRegistered && (
            <div className="pl-7 space-y-1.5">
              <label className="text-[10px] text-zinc-400 uppercase block font-semibold">VAT Registration Number *</label>
              <input
                type="text"
                value={vatNumber}
                onChange={(e) => setVatNumber(e.target.value)}
                placeholder="e.g. VAT-01234567-X"
                className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 uppercase rounded text-xs font-mono"
                required={isVatRegistered}
              />
              <p className="text-[10px] text-zinc-400 font-sans mt-1 leading-normal normal-case">
                Provide your KRA-issued VAT registration number to display alongside PIN in document header templates.
              </p>
            </div>
          )}
        </div>

        <div className="border-t border-zinc-200/80 pt-4 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary-modern px-6 py-2.5 font-semibold uppercase tracking-wider text-xs disabled:bg-zinc-300"
          >
            {saving ? (
              <span className="flex items-center justify-center gap-1.5">
                <Spinner size={12} color="white" />
                <span>SAVING...</span>
              </span>
            ) : (
              "COMMIT CHANGES"
            )}
          </button>
        </div>
      </form>

      {/* ── PAYMENT METHODS ── */}
      <div className="card-modern bg-white">
        <div className="p-6 border-b border-zinc-200/80 space-y-1">
          <h2 className="font-sans font-semibold uppercase tracking-wider text-sm text-black">Payment Methods</h2>
          <p className="font-sans text-xs text-zinc-500 normal-case">
            These appear on client-facing invoices as remittance instructions.
          </p>
        </div>

        {/* Existing Methods List */}
        {initialMethods.length > 0 && (
          <div className="divide-y divide-zinc-200/80 border-b border-zinc-200/80">
            {initialMethods.map((pm) => (
              <div key={pm.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 font-mono text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold uppercase text-black">{pm.name}</span>
                    {pm.isDefault && (
                      <span className="bg-black text-white px-1.5 py-0.5 text-[9px] font-semibold uppercase rounded">DEFAULT</span>
                    )}
                  </div>
                  <p className="text-zinc-500 mt-1 text-[11px] font-mono leading-relaxed whitespace-pre-wrap">{pm.details}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {!pm.isDefault && (
                    <button
                      type="button"
                      disabled={setDefaultPaymentMutation.isPending}
                      onClick={() => {
                        setDefaultPaymentMutation.mutate(pm.id, {
                          onSuccess: () => router.refresh(),
                        });
                      }}
                      className="btn-secondary-modern px-2 py-1 text-[10px] font-semibold uppercase flex items-center justify-center gap-1"
                    >
                      {setDefaultPaymentMutation.isPending && setDefaultPaymentMutation.variables === pm.id ? (
                        <>
                          <Spinner size={8} />
                          <span>Setting...</span>
                        </>
                      ) : (
                        "Make Default"
                      )}
                    </button>
                  )}
                  {deletingPmId === pm.id ? (
                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95">
                      <span className="text-[9px] text-rose-600 font-bold uppercase">Confirm?</span>
                      <button
                        type="button"
                        disabled={deletePaymentMutation.isPending}
                        onClick={() => {
                          deletePaymentMutation.mutate(pm.id, {
                            onSuccess: () => {
                              setDeletingPmId(null);
                              router.refresh();
                            },
                          });
                        }}
                        className="bg-rose-600 text-white px-2 py-1 text-[10px] font-semibold uppercase hover:bg-rose-700 rounded transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                      >
                        {deletePaymentMutation.isPending && deletePaymentMutation.variables === pm.id ? (
                          <>
                            <Spinner size={8} color="white" />
                            <span>...</span>
                          </>
                        ) : (
                          "Yes"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPmId(null)}
                        className="bg-zinc-100 text-zinc-500 px-2 py-1 text-[10px] font-semibold uppercase hover:bg-zinc-200 rounded transition-colors"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPm(pm);
                          setEditName(pm.name);
                          setEditDetails(pm.details);
                          setEditDefault(pm.isDefault);
                          document.getElementById("payment-method-form-anchor")?.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="border border-zinc-300 bg-white text-zinc-600 px-2 py-1 text-[10px] font-semibold uppercase hover:border-black hover:text-black rounded transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingPmId(pm.id)}
                        className="border border-rose-200 bg-rose-50 text-rose-600 px-2 py-1 text-[10px] font-semibold uppercase hover:bg-rose-600 hover:text-white rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  )}
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

        <div id="payment-method-form-anchor" />

        {editingPm ? (
          <form onSubmit={handleEditPaymentMethod} className="p-6 space-y-6 font-mono text-xs bg-amber-50/10 border-t border-amber-200">
            <div className="space-y-1">
              <p className="text-[10px] text-amber-700 uppercase font-bold">Edit Payment Method</p>
              <p className="font-sans text-xs text-zinc-500">Update the details or change instructions for this remittance method.</p>
            </div>

            <div className="space-y-4 border border-zinc-200 p-4 bg-white rounded">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Method Name *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="e.g., NCBA Bank Account"
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Instructions / Details *</label>
                <textarea
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                  placeholder="Account number / instructions"
                  rows={4}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-mono leading-relaxed"
                  required
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="editDefault"
                  checked={editDefault}
                  onChange={(e) => setEditDefault(e.target.checked)}
                  className="w-4 h-4 border border-zinc-300 accent-black rounded-sm cursor-pointer"
                />
                <label htmlFor="editDefault" className="cursor-pointer select-none uppercase font-semibold text-xs">
                  Set as default payment method on invoices
                </label>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updatePaymentMutation.isPending}
                className="btn-primary-modern bg-black text-white px-6 py-2.5 font-semibold uppercase tracking-wider text-xs disabled:bg-zinc-300"
              >
                {updatePaymentMutation.isPending ? (
                  <span className="flex items-center justify-center gap-1.5">
                    <Spinner size={12} color="white" />
                    <span>SAVING...</span>
                  </span>
                ) : (
                  "SAVE CHANGES"
                )}
              </button>
              <button
                type="button"
                onClick={() => setEditingPm(null)}
                className="bg-zinc-100 text-zinc-600 px-6 py-2.5 rounded font-semibold uppercase hover:bg-zinc-200 border border-zinc-200 text-xs transition-colors"
              >
                CANCEL
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAddPaymentMethod} className="p-6 space-y-6 font-mono text-xs bg-zinc-50/50 border-t border-zinc-200/80">
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Add New Payment Method</p>
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
                  className={`py-2 px-3 text-[11px] font-semibold uppercase border rounded transition-colors ${
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
              <div className="space-y-4 border border-zinc-200 p-4 bg-white rounded">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block font-semibold">Bank Name *</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g., NCBA Bank / KCB"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block font-semibold">Branch Name</label>
                    <input
                      type="text"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="e.g., Kilimani Branch"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block font-semibold">Account Name / Title *</label>
                    <input
                      type="text"
                      value={accountName}
                      onChange={(e) => setAccountName(e.target.value)}
                      placeholder="e.g., Ventures of Africa LTD"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block font-semibold">Account Number *</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      placeholder="e.g., 01108239101"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs font-semibold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">SWIFT / BIC Code (Optional)</label>
                  <input
                    type="text"
                    value={swiftCode}
                    onChange={(e) => setSwiftCode(e.target.value)}
                    placeholder="e.g., NCBAKE22"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 uppercase rounded text-xs"
                  />
                </div>
              </div>
            )}

            {/* M-PESA TILL FIELDS */}
            {pmCategory === "TILL" && (
              <div className="space-y-4 border border-zinc-200 p-4 bg-white rounded">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block font-semibold">Till Number *</label>
                    <input
                      type="text"
                      value={tillNumber}
                      onChange={(e) => setTillNumber(e.target.value)}
                      placeholder="e.g., 552134"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block font-semibold">Store / Merchant Name</label>
                    <input
                      type="text"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      placeholder="e.g., Ventures of Africa"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* M-PESA PAYBILL FIELDS */}
            {pmCategory === "PAYBILL" && (
              <div className="space-y-4 border border-zinc-200 p-4 bg-white rounded">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block font-semibold">Business / Paybill Number *</label>
                    <input
                      type="text"
                      value={paybillNumber}
                      onChange={(e) => setPaybillNumber(e.target.value)}
                      placeholder="e.g., 247247"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs font-semibold"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block font-semibold">Account Ref / Instructions</label>
                    <input
                      type="text"
                      value={accountRef}
                      onChange={(e) => setAccountRef(e.target.value)}
                      placeholder="e.g., Invoice Number / Client Name"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* CUSTOM INSTRUCTIONS FIELDS */}
            {pmCategory === "CUSTOM" && (
              <div className="space-y-4 border border-zinc-200 p-4 bg-white rounded">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Method Title *</label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g., PayPal / Cash / Cheque"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs font-semibold"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Payment Instructions *</label>
                  <textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="e.g., Send PayPal payment to billing@domain.com or issue cheque to Ventures of Africa LTD."
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs h-20 font-sans"
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
                className="w-4 h-4 border border-zinc-300 accent-black rounded-sm cursor-pointer"
              />
              <label htmlFor="pmDefault" className="cursor-pointer select-none uppercase font-semibold text-xs">
                Set as default payment method on invoices
              </label>
            </div>

            <button
              type="submit"
              disabled={addPaymentMutation.isPending}
              className="btn-primary-modern px-6 py-2.5 font-semibold uppercase tracking-wider text-xs disabled:bg-zinc-300 w-full sm:w-auto"
            >
              {addPaymentMutation.isPending ? (
                <span className="flex items-center justify-center gap-1.5">
                  <Spinner size={12} color="white" />
                  <span>SAVING...</span>
                </span>
              ) : (
                "+ SAVE PAYMENT METHOD"
              )}
            </button>
          </form>
        )}
      </div>
    </div>

    {/* ── LEDGER DIAGNOSTICS & MAINTENANCE ── */}
    <div className="card-modern p-6 bg-white font-mono text-xs space-y-4">
      <div>
        <h2 className="font-semibold uppercase tracking-wider text-sm text-black font-sans">Ledger Diagnostics &amp; Maintenance</h2>
        <p className="text-[10px] text-zinc-400 uppercase mt-0.5">Repair and rebuild workspace transaction records</p>
      </div>
      <div className="border-t border-zinc-200/80 pt-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1 max-w-xl">
          <p className="font-bold text-zinc-900 uppercase text-[11px]">Rebuild Ledger Journal Entries</p>
          <p className="font-sans text-[11px] text-zinc-500 normal-case leading-normal">
            This utility will clear all automatically generated journal entries (debits and credits) associated with invoices, receipts, credit notes, LPOs, and POs in this workspace. It will then reconstruct them chronologically using the latest lifecycle posting rules. Recommended if your analytics or general ledger balances are out of sync.
          </p>
        </div>
        {showRebuildConfirm ? (
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <button
              type="button"
              onClick={handleRebuildLedger}
              disabled={repairing}
              className="btn-primary-modern bg-rose-600 hover:bg-rose-700 text-white border border-rose-600 px-6 py-2.5 font-semibold uppercase tracking-wider text-xs disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {repairing ? "REBUILDING..." : "CONFIRM REBUILD"}
            </button>
            <button
              type="button"
              onClick={() => setShowRebuildConfirm(false)}
              disabled={repairing}
              className="btn-secondary-modern px-6 py-2.5 font-semibold uppercase tracking-wider text-xs border border-zinc-300 hover:bg-zinc-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              CANCEL
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowRebuildConfirm(true)}
            disabled={repairing}
            className="btn-secondary-modern px-6 py-2.5 font-semibold uppercase tracking-wider text-xs border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            REBUILD JOURNAL ENTRIES
          </button>
        )}
      </div>
    </div>
  </div>
  );
}
