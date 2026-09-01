// src/app/workspaces/[slug]/suppliers/page.tsx
import { db } from "@/db";
import { suppliers, shops } from "@/db/schema";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
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

  const search = filters.search?.trim() || "";
  const classification = filters.classification || "ALL";

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // Build dynamic search criteria
  const conditions = [eq(suppliers.shopId, shop.id)];

  if (search) {
    conditions.push(
      or(
        ilike(suppliers.name, `%${search}%`),
        ilike(suppliers.email, `%${search}%`),
        ilike(suppliers.phone, `%${search}%`),
        ilike(suppliers.taxPin, `%${search}%`)
      )!
    );
  }

  if (classification && classification !== "ALL") {
    conditions.push(eq(suppliers.supplierType, classification as any));
  }

  const supplierList = await db.query.suppliers.findMany({
    where: and(...conditions),
    orderBy: [desc(suppliers.createdAt)],
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
      {/* HEADER + CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Supplier Registry</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Supplier Network</h1>
        </div>

        <SupplierFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* SEARCH AND FILTER BAR */}
      <SupplierFilterBar />

      {/* SUPPLIER REGISTRY TABLE */}
      <div className="card-modern overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">Supplier / Vendor Name</th>
              <th className="p-4 border-r border-zinc-200">Email Contact</th>
              <th className="p-4 border-r border-zinc-200">Telephone</th>
              <th className="p-4 border-r border-zinc-200">Type</th>
              <th className="p-4 border-r border-zinc-200">KRA Tax PIN</th>
              <th className="p-4 border-r border-zinc-200 text-center">Terms</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {supplierList.map((sup) => (
              <tr key={sup.id} className="hover:bg-zinc-50/80 transition-colors">
                <td className="p-4 border-r border-zinc-200/80 font-semibold uppercase">
                  <Link
                    href={`/workspaces/${slug}/suppliers/${sup.id}`}
                    className="hover:underline text-black font-sans text-sm tracking-tight"
                  >
                    {sup.name}
                  </Link>
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-600 font-sans">
                  {sup.email}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-600 font-mono">
                  {sup.phone || "—"}
                </td>
                <td className="p-4 border-r border-zinc-200/80">
                  <span className={
                    sup.supplierType === "CORPORATE" ? "badge-black" :
                    sup.supplierType === "INDIVIDUAL" ? "badge-zinc" :
                    "badge-zinc text-zinc-400"
                  }>
                    {sup.supplierType}
                  </span>
                </td>
                <td className="p-4 border-r border-zinc-200/80 font-semibold text-black tracking-widest font-mono">
                  {sup.taxPin || <span className="text-zinc-300 font-normal italic">None</span>}
                  {sup.requiresEtims && (
                    <span className="ml-2 badge-emerald text-[9px]">
                      eTIMS
                    </span>
                  )}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-center font-semibold text-[10px] font-mono">
                  {sup.paymentTerms || "NET_30"}
                </td>
                <td className="p-4 text-center font-mono">
                  <SupplierRowPopover supplier={sup} shopId={shop.id} shopSlug={slug} />
                </td>
              </tr>
            ))}

            {supplierList.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                  No suppliers found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
