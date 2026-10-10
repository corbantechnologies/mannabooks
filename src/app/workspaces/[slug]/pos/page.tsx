// src/app/workspaces/[slug]/pos/page.tsx
import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { apiClient } from "@/lib/api/client";
import { WalkInSalesTerminal } from "./WalkInSalesTerminal";
import Link from "next/link";
import { Suspense } from "react";

interface WalkInSalesPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WalkInSalesPage({ params }: WalkInSalesPageProps) {
  // 1. Await params (required in Next.js 15+)
  const { slug } = await params;

  // 2. Resolve active tenant shop via FastAPI
  const { shop } = await getActiveWorkspaceContext(slug);

  // 3. Fetch active product catalog and clients for instant selection via FastAPI
  const [itemsRes, clientsRes] = await Promise.all([
    apiClient.get<any[]>(`/v1/items?shop_id=${shop.id}&limit=300`),
    apiClient.get<any[]>(`/v1/clients?shop_id=${shop.id}&limit=200`),
  ]);

  const productRegistry = (itemsRes.data || []).map((p: any) => ({
    id: String(p.id),
    shopId: String(p.shop_id || p.shopId || shop.id),
    name: p.name,
    sku: p.sku || null,
    itemType: p.item_type || p.itemType || "PRODUCT",
    unitPrice: String(p.unit_price ?? p.unitPrice ?? "0.00"),
    costPrice: String(p.cost_price ?? p.costPrice ?? "0.00"),
    defaultTaxType: p.default_tax_type ?? p.defaultTaxType ?? "V_16",
    trackStock: Boolean(p.track_stock ?? p.trackStock),
    stockQuantity: String(p.stock_quantity ?? p.stockQuantity ?? "0.00"),
  }));

  const shopClients = (clientsRes.data || [])
    .filter((c: any) => (c.name || "").toLowerCase() !== "walk-in customer")
    .map((c: any) => ({
      id: String(c.id),
      name: c.name,
      email: c.email || null,
      phone: c.phone || null,
      taxPin: c.tax_pin || c.taxPin || null,
    }));

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-6 selection:bg-black selection:text-white">
      
      {/* TERMINAL HEADER & METRICS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider block">
            Counter Sales // Fast POS Terminal
          </span>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans mt-0.5">
            Instant Counter Terminal
          </h1>
          <p className="font-sans text-xs text-zinc-500 mt-1">
            Rapid barcode billing and cash sale issuance for {shop.name}. Auto-posts paid receipt to sales ledger.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/workspaces/${slug}/documents`}
            className="px-3.5 py-1.5 border border-zinc-200 hover:border-black rounded text-xs font-semibold text-zinc-700 hover:text-black transition-colors"
          >
            ← View Document Ledger
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-semibold uppercase">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>POS Online</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="font-sans text-xs text-zinc-500 p-8 border border-zinc-200 bg-zinc-50 rounded-lg text-center">Loading POS Terminal...</div>}>
        <WalkInSalesTerminal
          shop={shop}
          shopSlug={slug}
          products={productRegistry}
          clients={shopClients}
        />
      </Suspense>

    </div>
  );
}
