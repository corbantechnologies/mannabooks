// src/app/workspaces/[slug]/suppliers/page.tsx
import { db } from "@/db";
import { suppliers, shops } from "@/db/schema";
import { eq, and, ilike, or, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SupplierFormClientSide } from "./SupplierFormClientSide";
import { SupplierFilterBar } from "./SupplierFilterBar";
import { EditSupplierModal } from "./EditSupplierModal";

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
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white font-mono">
      {/* HEADER + CTA */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black pb-6">
        <div>
          <span className="text-xs text-zinc-400">PROCUREMENT_NETWORK // ACCOUNTS_PAYABLE</span>
          <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">Supplier Network</h1>
        </div>

        <SupplierFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* SEARCH AND FILTER BAR */}
      <SupplierFilterBar />

      {/* SUPPLIER REGISTRY TABLE */}
      <div className="border border-black bg-white overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-black uppercase tracking-wider font-bold">
              <th className="p-4 border-r border-black">Supplier / Vendor Name</th>
              <th className="p-4 border-r border-black">Email Contact</th>
              <th className="p-4 border-r border-black">Telephone</th>
              <th className="p-4 border-r border-black">Type</th>
              <th className="p-4 border-r border-black">KRA Tax PIN</th>
              <th className="p-4 border-r border-black text-center">Terms</th>
              <th className="p-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {supplierList.map((sup) => (
              <tr key={sup.id} className="hover:bg-zinc-50 transition-colors">
                <td className="p-4 border-r border-black font-bold uppercase">
                  <Link
                    href={`/workspaces/${slug}/suppliers/${sup.id}`}
                    className="hover:underline text-black"
                  >
                    {sup.name}
                  </Link>
                </td>
                <td className="p-4 border-r border-black text-zinc-600 font-sans">
                  {sup.email}
                </td>
                <td className="p-4 border-r border-black text-zinc-600">
                  {sup.phone || "—"}
                </td>
                <td className="p-4 border-r border-black">
                  <span className={`px-1.5 py-0.5 font-bold uppercase text-[10px] ${
                    sup.supplierType === "CORPORATE" ? "bg-black text-white" :
                    sup.supplierType === "INDIVIDUAL" ? "border border-black bg-white" :
                    "bg-zinc-100 text-zinc-400"
                  }`}>
                    {sup.supplierType}
                  </span>
                </td>
                <td className="p-4 border-r border-black font-bold text-black tracking-widest">
                  {sup.taxPin || <span className="text-zinc-300 font-normal italic lowercase">&gt; unassigned</span>}
                  {sup.requiresEtims && (
                    <span className="ml-2 border border-black px-1 py-0.5 text-[8px] bg-zinc-50 font-bold uppercase">
                      eTIMS
                    </span>
                  )}
                </td>
                <td className="p-4 border-r border-black text-center font-bold text-[10px]">
                  {sup.paymentTerms || "NET_30"}
                </td>
                <td className="p-4 text-center">
                  <EditSupplierModal supplier={sup} shopId={shop.id} shopSlug={slug} />
                </td>
              </tr>
            ))}

            {supplierList.length === 0 && (
              <tr>
                <td colSpan={7} className="p-12 text-center text-zinc-400 italic">
                  &gt; SUPPLIER REGISTRY EMPTY. NO VENDOR NODES MATCHING SEARCH CRITERIA.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
