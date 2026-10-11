"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useClients } from "@/hooks/useClients";
import { ClientRowPopover } from "./ClientRowPopover";
import { Spinner } from "@/components/Spinner";

interface ClientsTableClientProps {
  shopId: string;
  shopSlug: string;
}

export function ClientsTableClient({ shopId, shopSlug }: ClientsTableClientProps) {
  const searchParams = useSearchParams();
  const search = searchParams.get("search")?.trim().toLowerCase() || "";
  const clientType = searchParams.get("clientType") || "ALL";

  const { data: rawClients = [], isLoading, error, refetch } = useClients(shopId);

  if (isLoading) {
    return (
      <div className="surface p-12 bg-white flex flex-col items-center justify-center space-y-3">
        <Spinner className="w-5 h-5 text-zinc-600 animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Loading client directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="surface p-8 bg-rose-50/50 text-center space-y-3">
        <p className="text-xs font-semibold text-rose-700">Failed to load client directory.</p>
        <button
          onClick={() => refetch()}
          className="text-xs bg-rose-600 text-white px-3 py-1.5 rounded-lg hover:bg-rose-700 font-medium transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  let clientList = Array.isArray(rawClients) ? rawClients : [];

  if (clientType && clientType !== "ALL") {
    clientList = clientList.filter((c: any) => (c.clientType || c.client_type) === clientType);
  }

  if (search) {
    clientList = clientList.filter((c: any) => {
      const name = (c.name || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const taxPin = (c.taxPin || c.tax_pin || "").toLowerCase();
      return (
        name.includes(search) ||
        email.includes(search) ||
        phone.includes(search) ||
        taxPin.includes(search)
      );
    });
  }

  return (
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
          {clientList.map((c: any) => {
            const cType = c.clientType || c.client_type;
            const cPin = c.taxPin || c.tax_pin;
            const requiresEtims = Boolean(c.requiresEtims ?? c.requires_etims);

            const popoverClient = {
              id: c.id,
              name: c.name,
              email: c.email,
              phone: c.phone,
              clientType: cType,
              taxPin: cPin,
              requiresEtims,
            };

            return (
              <tr
                key={c.id}
                className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0"
              >
                <td className="px-4 py-3 border-r border-zinc-100 font-sans text-sm font-semibold text-zinc-900">
                  <Link
                    href={`/workspaces/${shopSlug}/clients/${c.id}`}
                    className="hover:underline underline-offset-2"
                  >
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
                  <span
                    className={
                      cType === "CORPORATE"
                        ? "badge-black"
                        : cType === "INDIVIDUAL"
                        ? "badge-zinc"
                        : "badge-zinc text-zinc-500"
                    }
                  >
                    {cType}
                  </span>
                </td>
                <td className="p-4 border-r border-zinc-100 font-semibold text-black tracking-widest font-mono">
                  {cPin || <span className="text-zinc-300 font-normal italic">None</span>}
                  {requiresEtims && (
                    <span className="ml-2 badge-emerald text-[9px]">eTIMS</span>
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <ClientRowPopover client={popoverClient} shopId={shopId} shopSlug={shopSlug} />
                </td>
              </tr>
            );
          })}

          {clientList.length === 0 && (
            <tr>
              <td
                colSpan={6}
                className="p-12 text-center text-zinc-400 italic font-sans text-xs"
              >
                No clients found matching your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
