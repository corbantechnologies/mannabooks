// src/app/workspaces/[slug]/clients/page.tsx
import { db } from "@/db";
import { clients, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ClientFormClientSide } from "./ClientFormClientSide";

interface ClientsPageProps {
  params: { slug: string };
}

export default async function WorkspaceClientsPage({ params }: ClientsPageProps) {
  // 1. Resolve shop context on the server
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, params.slug),
  });

  if (!shop) {
    notFound();
  }

  // 2. Query all registered clients under this tenant boundary
  const clientList = await db.query.clients.findMany({
    where: eq(clients.shopId, shop.id),
    orderBy: [desc(clients.createdAt)],
  });

  return (
    <div className="p-8 space-y-12 selection:bg-black selection:text-white">
      
      {/* HEADER META STRIP */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-black pb-6">
        <div>
          <span className="font-mono text-xs text-zinc-400">REGISTRY // CLIENT_FLOW_PIPELINE</span>
          <h1 className="text-3xl font-bold uppercase tracking-tighter mt-1">Client Directory</h1>
        </div>
        
        {/* Pass the server-side shopId directly down to the interactive handler */}
        <ClientFormClientSide shopId={shop.id} />
      </div>

      {/* STARK LOG DATA TABLE */}
      <div className="border border-black bg-white overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-black uppercase tracking-wider font-bold">
              <th className="p-4 border-r border-black">Client Name</th>
              <th className="p-4 border-r border-black">Email Identifier</th>
              <th className="p-4 border-r border-black">Phone Reference</th>
              <th className="p-4 border-r border-black">Classification</th>
              <th className="p-4">Statutory Tax PIN</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {clientList.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                <td className="p-4 border-r border-black font-sans text-sm font-bold uppercase tracking-tight">
                  {c.name}
                </td>
                <td className="p-4 border-r border-black text-zinc-600 font-sans">
                  {c.email}
                </td>
                <td className="p-4 border-r border-black text-zinc-600">
                  {c.phone || "—"}
                </td>
                <td className="p-4 border-r border-black">
                  <span className={`px-1.5 py-0.5 font-bold uppercase tracking-tight ${
                    c.clientType === "CORPORATE" ? "bg-black text-white" :
                    c.clientType === "INDIVIDUAL" ? "border border-black bg-white" :
                    "bg-zinc-100 text-zinc-400"
                  }`}>
                    {c.clientType}
                  </span>
                </td>
                <td className="p-4 font-bold text-black tracking-widest">
                  {c.taxPin || <span className="text-zinc-300 font-normal italic lowercase">&gt; unassigned</span>}
                </td>
              </tr>
            ))}

            {clientList.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-zinc-400 italic">
                  &gt; REGISTRY EMPTY. NO ACTIVE CONTACT NODES LOCATED.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}