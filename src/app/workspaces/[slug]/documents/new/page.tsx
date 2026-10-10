import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { DocumentBuilderClientForm } from "./DocumentBuilderClientForm";
import Link from "next/link";
import { Suspense } from "react";
import { apiClient } from "@/lib/api/client";
import { getShopCurrencies } from "@/lib/actions/currencies";
import { getShopTerms } from "@/lib/actions/terms";
import { getLoyaltyProgram, getMembershipTiers } from "@/lib/actions/loyalty";

interface NewDocumentPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewDocumentPage({ params }: NewDocumentPageProps) {
  // 1. Await params (required in Next.js 15+)
  const { slug } = await params;

  // 2. Resolve multi-tenant shop criteria via FastAPI context
  const { shop } = await getActiveWorkspaceContext(slug);

  // 3. Fetch active registries from FastAPI endpoints in parallel
  const [clientsRes, suppliersRes, itemsRes, locationsRes, termsRegistry, currenciesRegistry] = await Promise.all([
    apiClient.get<any[]>(`/v1/clients?shop_id=${shop.id}&limit=200`),
    apiClient.get<any[]>(`/v1/suppliers?shop_id=${shop.id}&limit=200`),
    apiClient.get<any[]>(`/v1/items?shop_id=${shop.id}&limit=300`),
    apiClient.get<any[]>(`/v1/items/locations?shop_id=${shop.id}`),
    getShopTerms(shop.id),
    getShopCurrencies(shop.id, shop.currency || "KES"),
  ]);

  const clientRegistry = (clientsRes.data || []).map((c: any) => ({
    id: String(c.id),
    name: c.name,
    email: c.email || "",
    phone: c.phone || "",
    taxPin: c.tax_pin || c.taxPin || null,
    clientType: c.client_type || c.clientType || "BUSINESS",
    creditLimit: c.credit_limit || c.creditLimit || "0.00",
    outstandingBalance: c.outstanding_balance || c.outstandingBalance || "0.00",
    paymentTerms: c.payment_terms || c.paymentTerms || null,
  }));

  const supplierRegistry = (suppliersRes.data || []).map((s: any) => ({
    id: String(s.id),
    name: s.name,
    email: s.email || "",
    phone: s.phone || "",
    taxPin: s.tax_pin || s.taxPin || null,
    supplierType: s.supplier_type || s.supplierType || "BUSINESS",
    paymentTerms: s.payment_terms || s.paymentTerms || null,
  }));

  const productRegistry = (itemsRes.data || []).map((p: any) => ({
    id: String(p.id),
    name: p.name,
    sku: p.sku || null,
    unitPrice: String(p.unit_price ?? p.unitPrice ?? "0.00"),
    costPrice: String(p.cost_price ?? p.costPrice ?? "0.00"),
    defaultTaxType: p.default_tax_type ?? p.defaultTaxType ?? "V_16",
    trackStock: Boolean(p.track_stock ?? p.trackStock),
    stockQuantity: String(p.stock_quantity ?? p.stockQuantity ?? "0.00"),
    itemType: p.item_type ?? p.itemType ?? "PRODUCT",
  }));

  const locationsRegistry = (locationsRes.data || []).map((l: any) => ({
    id: String(l.id),
    name: l.name,
    address: l.address || null,
    isDefault: Boolean(l.isDefault ?? l.is_default),
    isActive: Boolean(l.isActive ?? l.is_active ?? true),
  }));

  let loyaltyProgram: any = null;
  let membershipTiers: any[] = [];
  try {
    const [loyaltyProgramRes, membershipTiersRes] = await Promise.all([
      getLoyaltyProgram(shop.id),
      getMembershipTiers(shop.id),
    ]);
    if (loyaltyProgramRes?.success) loyaltyProgram = loyaltyProgramRes.data;
    if (membershipTiersRes?.success && Array.isArray(membershipTiersRes.data)) membershipTiers = membershipTiersRes.data;
  } catch (err) {
    console.warn("[NewDocumentPage] Loyalty module bypass:", err);
  }

  return (
    <div className="p-4 sm:p-8 max-w-7xl space-y-8 selection:bg-black selection:text-white">
      
      {/* PAGE HEADER WITH BACK LINK */}
      <div className="space-y-2">
        <Link
          href={`/workspaces/${slug}/documents`}
          className="text-xs font-sans font-bold text-zinc-400 hover:text-black transition-colors block"
        >
          ← Back to Billing &amp; Invoices
        </Link>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <span className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider block">Create Transaction</span>
            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans mt-0.5">
              Issue Financial Document
            </h1>
            <p className="font-sans text-xs text-zinc-500 mt-1">
              Create eTIMS compliant invoices, receipts, quotations, purchase orders, and financial vouchers for {shop.name}.
            </p>
          </div>

          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-semibold uppercase ${
            shop.isVatRegistered
              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
              : "bg-zinc-50 text-zinc-700 border border-zinc-200"
          }`}>
            <span className={`w-2 h-2 rounded-full ${shop.isVatRegistered ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"}`} />
            <span>{shop.isVatRegistered ? "eTIMS 16% VAT Active" : "Non-VAT Account"}</span>
          </div>
        </div>
      </div>

      <Suspense fallback={<div className="font-sans text-xs text-zinc-500 p-8 border border-zinc-200 bg-zinc-50 rounded-lg text-center">Loading document editor...</div>}>
        <DocumentBuilderClientForm 
          shop={shop}
          shopSlug={slug}
          clients={clientRegistry}
          suppliers={supplierRegistry}
          products={productRegistry}
          shopTerms={termsRegistry}
          currencies={currenciesRegistry}
          stockLocations={locationsRegistry}
          loyaltyProgram={loyaltyProgram}
          membershipTiers={membershipTiers}
        />
      </Suspense>
    </div>
  );
}