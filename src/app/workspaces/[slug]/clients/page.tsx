// src/app/workspaces/[slug]/clients/page.tsx
import { db } from "@/db";
import { clients, shops } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ClientFormClientSide } from "./ClientFormClientSide";
import { EditClientModal } from "./EditClientModal";
import Link from "next/link";

interface ClientsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceClientsPage({ params }: ClientsPageProps) {
  // 1. Await params (required in Next.js 15+)
  const { slug } = await params;

  // 2. Resolve shop context on the server
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // 3. Query all registered clients under this tenant boundary
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
        <ClientFormClientSide shopId={shop.id} shopSlug={slug} />
      </div>

      {/* STARK LOG DATA TABLE */}
      <div className="border border-black bg-white overflow-x-auto">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="bg-zinc-50 border-b border-black uppercase tracking-wider font-bold">
              <th className="p-4 border-r border-black">Client Name</th>
              <th className="p-4 border-r border-black">Email Identifier</th>
              <th className="p-4 border-r border-black">Phone Reference</th>
              <th className="p-4 border-r border-black font-mono">Classification</th>
              <th className="p-4 border-r border-black font-mono">Statutory Tax PIN</th>
              <th className="p-4 text-center font-mono">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {clientList.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 transition-colors">
                <td className="p-4 border-r border-black font-sans text-sm font-bold uppercase tracking-tight">
                  <Link href={`/workspaces/${slug}/clients/${c.id}`} className="hover:underline underline-offset-2">
                    {c.name}
                  </Link>
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
                <td className="p-4 border-r border-black font-bold text-black tracking-widest">
                  {c.taxPin || <span className="text-zinc-300 font-normal italic lowercase">&gt; unassigned</span>}
                </td>
                <td className="p-4 text-center">
                  <EditClientModal client={c} shopId={shop.id} shopSlug={slug} />
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