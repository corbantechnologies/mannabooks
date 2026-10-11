"use client";

import { useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import { useClients } from "@/hooks/useClients";
import { WalkInSalesTerminal } from "./WalkInSalesTerminal";
import { Spinner } from "@/components/Spinner";

interface PosTerminalWrapperProps {
  shop: any;
  shopSlug: string;
}

export function PosTerminalWrapper({ shop, shopSlug }: PosTerminalWrapperProps) {
  const { data: rawProducts = [], isLoading: isLoadingProducts } = useProducts(shop.id);
  const { data: rawClients = [], isLoading: isLoadingClients } = useClients(shop.id);

  const productRegistry = useMemo(() => {
    return (Array.isArray(rawProducts) ? rawProducts : []).map((p: any) => ({
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
  }, [rawProducts, shop.id]);

  const shopClients = useMemo(() => {
    return (Array.isArray(rawClients) ? rawClients : [])
      .filter((c: any) => (c.name || "").toLowerCase() !== "walk-in customer")
      .map((c: any) => ({
        id: String(c.id),
        name: c.name,
        email: c.email || null,
        phone: c.phone || null,
        taxPin: c.tax_pin || c.taxPin || null,
      }));
  }, [rawClients]);

  if (isLoadingProducts || isLoadingClients) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading POS catalog and contacts...</p>
      </div>
    );

  }

  return (
    <WalkInSalesTerminal
      shop={shop}
      shopSlug={shopSlug}
      products={productRegistry}
      clients={shopClients}
    />
  );
}
