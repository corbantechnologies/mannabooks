"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

interface EtimsSettingsClientProps {
  shopId: string;
  shopSlug: string;
  initialTaxPin: string;
  initialShopName: string;
}

export function EtimsSettingsClient({
  shopId,
  shopSlug,
  initialTaxPin,
  initialShopName,
}: EtimsSettingsClientProps) {
  const [kraPin, setKraPin] = useState(initialTaxPin);
  const [branchId, setBranchId] = useState("00");
  const [deviceSerial, setDeviceSerial] = useState(`MANNA-OSCU-${shopSlug.toUpperCase().slice(0, 5)}-00`);
  const [cmcKey, setCmcKey] = useState("");
  const [environment, setEnvironment] = useState<"SANDBOX" | "PRODUCTION">("SANDBOX");
  const [isLoading, setIsLoading] = useState(false);
  const [activeConfig, setActiveConfig] = useState<any>(null);

  const handleInitialize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kraPin || !cmcKey || !deviceSerial) {
      toast.error("Please fill in all required KRA device parameters.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/etims/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopId,
          kraPin: kraPin.toUpperCase().trim(),
          branchId: branchId.trim(),
          deviceSerial: deviceSerial.trim(),
          communicationKey: cmcKey.trim(),
          environment,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to initialize eTIMS device with KRA.");
      }

      toast.success("eTIMS Device Initialized & Verified with KRA!");
      setActiveConfig(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to communicate with KRA OSCU Gateway.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Informational Banner */}
      <div className="bg-zinc-50 border border-zinc-200 rounded-lg p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-black">
          System-to-System (OSCU) Tax Invoice Validation
        </h3>
        <p className="text-xs text-zinc-600 mt-1 leading-relaxed">
          MannaBooks connects directly to the Kenya Revenue Authority (KRA) electronic Tax Invoice Management System (eTIMS) via the 
          Online Sales Control Unit (OSCU) protocol. Invoices and receipts generated in this workspace will be signed, assigned official 
          KRA CU Serial numbers, and printed with statutory verification QR codes.
        </p>
      </div>

      <form onSubmit={handleInitialize} className="border border-zinc-200 rounded-lg p-6 bg-white space-y-6">
        <div className="border-b border-zinc-100 pb-4">
          <h2 className="text-base font-bold uppercase tracking-tight text-black">
            KRA Virtual Device Handshake
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Parameters provided during taxpayer eTIMS system onboarding on KRA iTax.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Taxpayer KRA PIN *
            </label>
            <input
              type="text"
              required
              maxLength={11}
              value={kraPin}
              onChange={(e) => setKraPin(e.target.value.toUpperCase())}
              placeholder="e.g. P051987654A or A001234567Z"
              className="w-full px-3 py-2 border border-zinc-300 rounded font-mono text-sm focus:outline-none focus:border-black uppercase"
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">11-character alphanumeric entity PIN.</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Branch Identifier (bhfId) *
            </label>
            <input
              type="text"
              required
              maxLength={10}
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              placeholder="00"
              className="w-full px-3 py-2 border border-zinc-300 rounded font-mono text-sm focus:outline-none focus:border-black"
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">"00" indicates Headquarters.</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Device Serial Number (dvcSrlNo) *
            </label>
            <input
              type="text"
              required
              value={deviceSerial}
              onChange={(e) => setDeviceSerial(e.target.value)}
              className="w-full px-3 py-2 border border-zinc-300 rounded font-mono text-sm focus:outline-none focus:border-black"
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">Unique identifier for this workspace instance.</span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Gateway Target Environment
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as any)}
              className="w-full px-3 py-2 border border-zinc-300 rounded text-sm focus:outline-none focus:border-black bg-white"
            >
              <option value="SANDBOX">Sandbox Testbed (timsvscu.kra.go.ke)</option>
              <option value="PRODUCTION">Production Gateway (etims-api.kra.go.ke)</option>
            </select>
            <span className="text-[11px] text-zinc-400 mt-1 block">Use Sandbox for KRA certification audits.</span>
          </div>

          <div className="md:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-zinc-700 mb-1">
              Communication Key (cmcKey) *
            </label>
            <input
              type="password"
              required
              value={cmcKey}
              onChange={(e) => setCmcKey(e.target.value)}
              placeholder="Enter private KRA communication key..."
              className="w-full px-3 py-2 border border-zinc-300 rounded font-mono text-sm focus:outline-none focus:border-black"
            />
            <span className="text-[11px] text-zinc-400 mt-1 block">
              Encrypted at rest using AES-256 before database persistence. Never exposed to browser clients.
            </span>
          </div>
        </div>

        {activeConfig && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded p-4 text-xs space-y-1">
            <p className="font-bold">✓ KRA Device Active &amp; Verified</p>
            <p>SDC ID: <span className="font-mono">{activeConfig.sdcId}</span></p>
            <p>MRC Number: <span className="font-mono">{activeConfig.mrcNo}</span></p>
            <p>Taxpayer: {activeConfig.taxpayerName || initialShopName}</p>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 bg-black text-white rounded font-bold text-xs uppercase tracking-wider hover:bg-zinc-800 disabled:opacity-50 transition-colors"
          >
            {isLoading ? "Verifying with KRA..." : "Handshake & Initialize Device"}
          </button>
        </div>
      </form>
    </div>
  );
}
