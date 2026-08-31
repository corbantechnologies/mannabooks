// src/app/workspaces/[slug]/clients/page.tsx
import { db } from "@/db";
import { clients, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ClientFormClientSide } from "./ClientFormClientSide";
import { EditClientModal } from "./EditClientModal";
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
    <div className="p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white">
      
      {/* HEADER META STRIP */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider">Client Base</span>
          <h1 className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans">Client Directory</h1>
        </div>
        
        {/* Pass the server-side shopId directly down to the interactive handler */}
        <ClientFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* FILTER & SEARCH CONTROL BAR */}
      <ClientFilterBar />

      {/* LOG DATA TABLE */}
      <div className="card-modern overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600">
              <th className="p-4 border-r border-zinc-200">Client Name</th>
              <th className="p-4 border-r border-zinc-200">Email Identifier</th>
              <th className="p-4 border-r border-zinc-200">Phone Reference</th>
              <th className="p-4 border-r border-zinc-200 font-mono">Classification</th>
              <th className="p-4 border-r border-zinc-200 font-mono">Statutory Tax PIN</th>
              <th className="p-4 text-center font-mono">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200/80 bg-white">
            {clientList.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                <td className="p-4 border-r border-zinc-200/80 font-sans text-sm font-semibold uppercase tracking-tight text-black">
                  <Link href={`/workspaces/${slug}/clients/${c.id}`} className="hover:underline underline-offset-2">
                    {c.name}
                  </Link>
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-600 font-sans">
                  {c.email}
                </td>
                <td className="p-4 border-r border-zinc-200/80 text-zinc-600">
                  {c.phone || "—"}
                </td>
                <td className="p-4 border-r border-zinc-200/80">
                  <span className={`px-2.5 py-0.5 font-semibold uppercase tracking-tight rounded text-[10px] ${
                    c.clientType === "CORPORATE" ? "bg-black text-white" :
                    c.clientType === "INDIVIDUAL" ? "border border-zinc-300 bg-white text-black" :
                    "bg-zinc-100 text-zinc-500"
                  }`}>
                    {c.clientType}
                  </span>
                </td>
                <td className="p-4 border-r border-zinc-200/80 font-semibold text-black tracking-widest">
                  {c.taxPin || <span className="text-zinc-300 font-normal italic">None</span>}
                  {c.requiresEtims && (
                    <span className="ml-2 border border-zinc-300 px-1.5 py-0.5 text-[8px] bg-zinc-50 font-semibold uppercase rounded">
                      eTIMS
                    </span>
                  )}
                </td>
                <td className="p-4 text-center">
                  <EditClientModal client={c} shopId={shop.id} shopSlug={slug} />
                </td>
              </tr>
            ))}

            {clientList.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-400 italic font-sans text-xs">
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