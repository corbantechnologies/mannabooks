"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSuppliers } from "@/hooks/useSuppliers";
import { SupplierRowPopover } from "./SupplierRowPopover";
import { Spinner } from "@/components/Spinner";

interface SuppliersTableClientProps {
  shopId: string;
  shopSlug: string;
}

export function SuppliersTableClient({ shopId, shopSlug }: SuppliersTableClientProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const classification = searchParams.get("classification") || "ALL";

  const { data: rawSuppliers = [], isLoading, error, refetch } = useSuppliers(shopId);

  if (isLoading) {
    return (
      <div className="border border-zinc-200/80 rounded-xl p-12 bg-white flex flex-col items-center justify-center space-y-3">
        <Spinner className="w-5 h-5 text-zinc-600 animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Loading supplier registry...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-rose-200 rounded-xl p-8 bg-rose-50/50 text-center space-y-3">
        <p className="text-xs font-semibold text-rose-700">Failed to load supplier records.</p>
        <button
          onClick={() => refetch()}
          className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 font-medium transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  let supplierList = Array.isArray(rawSuppliers) ? rawSuppliers : [];

  if (search) {
    supplierList = supplierList.filter(
      (s: any) =>
        (s.name || "").toLowerCase().includes(search) ||
        (s.email || "").toLowerCase().includes(search) ||
        (s.phone || "").toLowerCase().includes(search) ||
        (s.tax_pin || s.taxPin || "").toLowerCase().includes(search)
    );
  }

  if (classification && classification !== "ALL") {
    supplierList = supplierList.filter(
      (s: any) =>
        (s.supplier_type || s.supplierType || "BUSINESS").toUpperCase() ===
        classification.toUpperCase()
    );
  }

  if (supplierList.length === 0) {
    return (
      <div className="border border-dashed border-zinc-200 rounded-xl p-12 text-center bg-white">
        <p className="text-sm font-medium text-zinc-900">No suppliers registered</p>
        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
          Add your vendor contacts, statutory Tax PINs, and credit terms to streamline procurement and vendor bills.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/60 text-zinc-400 font-medium">
              <th className="py-3 px-4 font-normal">Supplier Name</th>
              <th className="py-3 px-4 font-normal">Type</th>
              <th className="py-3 px-4 font-normal">Tax PIN</th>
              <th className="py-3 px-4 font-normal">Contact</th>
              <th className="py-3 px-4 font-normal">Payment Terms</th>
              <th className="py-3 px-4 font-normal text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {supplierList.map((sup: any) => {
              const sId = sup.id;
              const sName = sup.name;
              const sEmail = sup.email;
              const sPhone = sup.phone;
              const sPin = sup.tax_pin || sup.taxPin;
              const sType = sup.supplier_type || sup.supplierType || "BUSINESS";
              const sTerms = sup.payment_terms || sup.paymentTerms;

              const popoverSupplier = {
                id: sId,
                name: sName,
                email: sEmail || "",
                phone: sPhone || null,
                supplierType: sType as any,
                taxPin: sPin || null,
                requiresEtims: Boolean(sup.requires_etims ?? sup.requiresEtims),
                paymentTerms: sTerms || null,
              };

              return (
                <tr key={sId} className="hover:bg-zinc-50/50 transition-colors">
                  <td className="py-3.5 px-4 font-medium text-zinc-900">
                    <Link
                      href={`/workspaces/${shopSlug}/suppliers/${sId}`}
                      className="hover:underline text-zinc-900 font-semibold"
                    >
                      {sName}
                    </Link>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-600">
                    <span className="inline-block px-2 py-0.5 bg-zinc-100 text-zinc-700 rounded text-[10px] font-medium">
                      {sType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-600">
                    {sPin ? (
                      <span className="font-semibold text-zinc-800">{sPin}</span>
                    ) : (
                      <span className="text-zinc-300 italic">None</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-600 font-mono text-[11px]">
                    {sEmail && <div>{sEmail}</div>}
                    {sPhone && <div className="text-zinc-400">{sPhone}</div>}
                    {!sEmail && !sPhone && <span className="text-zinc-300 italic">None</span>}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-zinc-600">
                    <span className="text-[11px]">{sTerms || "NET_30"}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <SupplierRowPopover
                      supplier={popoverSupplier}
                      shopId={shopId}
                      shopSlug={shopSlug}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
