// src/app/workspaces/[slug]/clients/page.tsx
import { db } from "@/db";
import { clients, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ClientFormClientSide } from "./ClientFormClientSide";
import { ClientRowPopover } from "./ClientRowPopover";
import Link from "next/link";

import { and } from "drizzle-orm";
import { ClientFilterBar } from "./ClientFilterBar";

interface ClientsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    search?: string;
    clientType?: string;
  }>;
}

export default async function WorkspaceClientsPage({ params, searchParams }: ClientsPageProps) {
  // 1. Await params and searchParams (required in Next.js 15+)
  const { slug } = await params;
  const { search, clientType } = await searchParams;

  // 2. Resolve shop context on the server
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 3. Query conditions
  const conditions = [eq(clients.shopId, shop.id)];
  if (clientType && clientType !== "ALL") {
    conditions.push(eq(clients.clientType, clientType as any));
  }

  let clientList = await db.query.clients.findMany({
    where: and(...conditions),
    orderBy: [desc(clients.createdAt)],
  });

  // Client-side text search filter
  if (search && search.trim() !== "") {
    const q = search.toLowerCase().trim();
    clientList = clientList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q)) ||
        (c.taxPin && c.taxPin.toLowerCase().includes(q))
    );
  }

  return (
    <div className="p-5 sm:p-7 space-y-6">
      
      {/* HEADER META STRIP */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="text-xs text-zinc-400 font-medium">Client Base</span>
          <h1 className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight">Client Directory</h1>
        </div>
        
        {/* Pass the server-side shopId directly down to the interactive handler */}
        <ClientFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <ClientFilterBar />

      {/* LOG DATA TABLE */}
      <div className="surface overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60">
              <th className="px-4 py-3 border-r border-zinc-100">Client Name</th>
              <th className="px-4 py-3 border-r border-zinc-100">Email Identifier</th>
              <th className="px-4 py-3 border-r border-zinc-100">Phone Reference</th>
              <th className="px-4 py-3 border-r border-zinc-100">Classification</th>
              <th className="px-4 py-3 border-r border-zinc-100">Statutory Tax PIN</th>
              <th className="p-4 text-center font-mono">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white">
            {clientList.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                <td className="px-4 py-3 border-r border-zinc-100 font-sans text-sm font-semibold text-zinc-900">
                  <Link href={`/workspaces/${slug}/clients/${c.id}`} className="hover:underline underline-offset-2">
                    {c.name}
                  </Link>
                </td>
                <td className="p-4 border-r border-zinc-100 text-zinc-600 font-sans">
                  {c.email}
                </td>
                <td className="p-4 border-r border-zinc-100 text-zinc-600">
                  {c.phone || "—"}
                </td>
                <td className="p-4 border-r border-zinc-100">
                  <span className={
                    c.clientType === "CORPORATE" ? "badge-black" :
                    c.clientType === "INDIVIDUAL" ? "badge-zinc" :
                    "badge-zinc text-zinc-500"
                  }>
                    {c.clientType}
                  </span>
                </td>
                <td className="p-4 border-r border-zinc-100 font-semibold text-black tracking-widest font-mono">
                  {c.taxPin || <span className="text-zinc-300 font-normal italic">None</span>}
                  {c.requiresEtims && (
                    <span className="ml-2 badge-emerald text-[9px]">
                      eTIMS
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <ClientRowPopover client={c} shopId={shop.id} shopSlug={slug} />
                </td>
              </tr>
            ))}

            {clientList.length === 0 && (
              <tr>
                <td colSpan={6} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
                  No clients found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}