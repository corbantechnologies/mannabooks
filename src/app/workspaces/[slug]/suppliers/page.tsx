// src/app/workspaces/[slug]/suppliers/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";
import { SupplierFormClientSide } from "./SupplierFormClientSide";
import { SupplierFilterBar } from "./SupplierFilterBar";
import { SupplierRowPopover } from "./SupplierRowPopover";

interface SuppliersPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    classification?: string;
  }>;
}

export default async function SuppliersPage({ params, searchParams }: SuppliersPageProps) {
  const { slug } = await params;
  const filters = await searchParams;

  const search = filters.search?.trim().toLowerCase() || "";
  const classification = filters.classification || "ALL";

  const { shop } = await getActiveWorkspaceContext(slug);

  const res = await apiClient.get<any[]>(`/v1/suppliers?shop_id=${shop.id}&limit=200`);
  let supplierList = res.data || [];

  if (search) {
    supplierList = supplierList.filter((s: any) =>
      (s.name || "").toLowerCase().includes(search) ||
      (s.email || "").toLowerCase().includes(search) ||
      (s.phone || "").toLowerCase().includes(search) ||
      (s.tax_pin || s.taxPin || "").toLowerCase().includes(search)
    );
  }

  if (classification && classification !== "ALL") {
    supplierList = supplierList.filter((s: any) =>
      (s.supplier_type || s.supplierType || "BUSINESS").toUpperCase() === classification.toUpperCase()
    );
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      {/* HEADER + CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Supplier Registry</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Supplier Network</h1>
        </div>

        <SupplierFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* SEARCH AND FILTER BAR */}
      <SupplierFilterBar />

      {/* SUPPLIERS DATA TABLE */}
      {supplierList.length === 0 ? (
        <div className="border border-dashed border-zinc-200 rounded-xl p-12 text-center bg-white">
          <p className="text-sm font-medium text-zinc-900">No suppliers registered</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
            Add your vendor contacts, statutory Tax PINs, and credit terms to streamline procurement and vendor bills.
          </p>
        </div>
      ) : (
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

                  return (
                    <tr key={sId} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-zinc-900">
                        <Link
                          href={`/workspaces/${slug}/suppliers/${sId}`}
                          className="hover:underline text-zinc-900"
                        >
                          {sName}
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 text-zinc-700">
                          {sType}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-zinc-600">
                        {sPin || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        <div>{sEmail || "—"}</div>
                        {sPhone && <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{sPhone}</div>}
                      </td>
                      <td className="py-3.5 px-4 text-zinc-500">
                        {sTerms || "Immediate"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <SupplierRowPopover
                          supplier={{
                            id: sId,
                            name: sName,
                            email: sEmail || null,
                            phone: sPhone || null,
                            taxPin: sPin || null,
                            supplierType: sType,
                            paymentTerms: sTerms || null,
                            requiresEtims: Boolean(sup.requires_etims || sup.requiresEtims),
                          }}
                          shopId={shop.id}
                          shopSlug={slug}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
