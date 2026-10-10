// src/app/workspaces/[slug]/products/ProductFormClientSide.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateProduct } from "@/hooks/useProducts";
import Link from "next/link";

interface StockLocation {
  id: string;
  name: string;
  code: string | null;
  isDefault: boolean;
}

const productSchema = z.object({
  name: z.string().min(2, "Product/service name is required."),
  sku: z.string().optional(),
  itemType: z.enum(["PRODUCT", "SERVICE"]),
  unitPrice: z.number().min(0, "Unit price must be non-negative."),
  costPrice: z.number().min(0),
  defaultTaxType: z.enum(["V_16", "V_0", "EXEMPT"]),
  trackStock: z.boolean(),
  stockQuantity: z.number().min(0),
  reorderThreshold: z.number().min(0),
  locationId: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export function ProductFormClientSide({
  shopId,
  shopSlug,
  locations = [],
}: {
  shopId: string;
  shopSlug: string;
  locations?: StockLocation[];
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const createProductMutation = useCreateProduct(shopId, shopSlug);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      sku: "",
      itemType: "PRODUCT",
      unitPrice: 0,
      costPrice: 0,
      defaultTaxType: "V_16",
      trackStock: false,
      stockQuantity: 0,
      reorderThreshold: 5,
      locationId: locations[0]?.id || undefined,
    },
  });

  const itemType = watch("itemType");
  const trackStock = watch("trackStock");

  function onSubmit(data: ProductFormData) {
    createProductMutation.mutate(
      {
        name: data.name,
        sku: data.sku || undefined,
        itemType: data.itemType,
        unitPrice: data.unitPrice,
        costPrice: data.costPrice,
        defaultTaxType: data.defaultTaxType,
        trackStock: data.itemType === "PRODUCT" ? data.trackStock : false,
        stockQuantity: data.stockQuantity,
        reorderThreshold: data.reorderThreshold,
        locationId: data.locationId || undefined,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          reset();
          router.refresh();
        },
      }
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider"
      >
        + Register Catalog Item
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-2xl w-full max-w-2xl my-4 sm:my-0 font-mono text-xs animate-in zoom-in-95 duration-150 relative overflow-hidden">
            {/* MODAL HEADER */}
            <div className="border-b border-zinc-100 p-6 flex justify-between items-start bg-zinc-50/50">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold uppercase tracking-tight font-sans text-black">
                  Add Product or Service
                </h2>
                <p className="font-sans text-[11px] text-zinc-400">
                  Add a new item or service to your catalog
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black text-sm font-bold px-2 py-1 rounded transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
              {/* ITEM TYPE TOGGLE */}
              <div className="space-y-1.5">
                <label className="text-zinc-400 uppercase block font-semibold text-[10px]">
                  Item Classification
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setValue("itemType", "PRODUCT")}
                    className={`py-3 px-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      itemType === "PRODUCT"
                        ? "border-emerald-800 bg-emerald-900 text-white shadow-2xs"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-600 hover:bg-emerald-50/40"
                    }`}
                  >
                    <div className="text-lg mb-0.5">📦</div>
                    <div className="font-bold uppercase text-xs">Product</div>
                    <div className="text-[10px] opacity-80">Tangible / Physical Good</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setValue("itemType", "SERVICE");
                      setValue("trackStock", false);
                    }}
                    className={`py-3 px-4 rounded-lg border-2 text-left transition-all cursor-pointer ${
                      itemType === "SERVICE"
                        ? "border-emerald-800 bg-emerald-900 text-white shadow-2xs"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-600 hover:bg-emerald-50/40"
                    }`}
                  >
                    <div className="text-lg mb-0.5">🛠️</div>
                    <div className="font-bold uppercase text-xs">Service</div>
                    <div className="text-[10px] opacity-80">Labor / Consulting</div>
                  </button>
                </div>
              </div>

              {/* NAME & SKU ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">
                    {itemType === "SERVICE"
                      ? "Service Name / Description *"
                      : "Product Name / Description *"}
                  </label>
                  <input
                    type="text"
                    {...register("name")}
                    placeholder={
                      itemType === "SERVICE"
                        ? "e.g., Consulting Hour, Legal Review"
                        : "e.g., Laptop Stand, Coffee Bag"
                    }
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded-md text-xs font-sans h-10"
                  />
                  {errors.name && (
                    <p className="text-[10px] text-rose-600 font-semibold">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-zinc-400 uppercase block font-semibold text-[10px]">
                      SKU / Code Reference
                    </label>
                    <span className="text-[9px] text-zinc-400 italic">Optional</span>
                  </div>
                  <input
                    type="text"
                    {...register("sku")}
                    placeholder="e.g., CON-SER-4821"
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded-md text-xs uppercase h-10"
                  />
                </div>
              </div>

              {/* PRICING ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">
                    Selling Price (KES) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("unitPrice", { valueAsNumber: true })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded-md text-xs font-semibold h-10"
                  />
                  {errors.unitPrice && (
                    <p className="text-[10px] text-rose-600 font-semibold">
                      {errors.unitPrice.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">
                    Cost Price / COGS (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    {...register("costPrice", { valueAsNumber: true })}
                    placeholder="0.00"
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded-md text-xs font-semibold h-10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">
                    Default Tax Type
                  </label>
                  <select
                    {...register("defaultTaxType")}
                    className="w-full px-3 py-2.5 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded-md text-xs font-semibold h-10"
                  >
                    <option value="V_16">16% VAT (Standard)</option>
                    <option value="V_0">0% VAT (Zero-Rated)</option>
                    <option value="EXEMPT">Tax Exempt</option>
                  </select>
                </div>
              </div>

              {/* INVENTORY TRACKING BLOCK */}
              {itemType === "PRODUCT" && (
                <div className="border border-zinc-200 bg-zinc-50/60 p-4 space-y-3 rounded-lg">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      className={`w-10 h-6 rounded-full transition-colors relative ${
                        trackStock ? "bg-emerald-800" : "bg-zinc-300"
                      }`}
                      onClick={() => setValue("trackStock", !trackStock)}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${
                          trackStock ? "left-5" : "left-1"
                        }`}
                      />
                    </div>
                    <div>
                      <span className="font-bold uppercase text-xs text-black block">
                        Track Inventory Stock
                      </span>
                      <span className="text-[10px] text-zinc-500">
                        Auto-deduct stock when sold via receipts / POS
                      </span>
                    </div>
                  </label>

                  {trackStock && (
                    <div className="space-y-3 pt-3 border-t border-zinc-200">
                      {/* LOCATION SELECTOR */}
                      <div className="space-y-1">
                        <label className="text-zinc-500 uppercase block text-[10px] font-semibold">
                          Stock Location
                        </label>
                        {locations.length > 0 ? (
                          <select
                            {...register("locationId")}
                            className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded-md text-xs font-semibold h-9"
                          >
                            {locations.map((loc) => (
                              <option key={loc.id} value={loc.id}>
                                {loc.name}
                                {loc.code ? ` (${loc.code})` : ""}
                                {loc.isDefault ? " — Default" : ""}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                            <span className="text-amber-800 text-[10px] font-semibold uppercase">
                              No locations configured — default location will be used
                            </span>
                            <Link
                              href={`/workspaces/${shopSlug}/inventory/locations`}
                              className="text-[10px] underline text-amber-700 hover:text-amber-900 whitespace-nowrap ml-2"
                              target="_blank"
                            >
                              Setup →
                            </Link>
                          </div>
                        )}
                      </div>

                      {/* STOCK QTY + REORDER */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-zinc-500 uppercase block text-[10px] font-semibold">
                            Opening Stock Qty
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            {...register("stockQuantity", { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded-md text-xs font-semibold h-9"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-zinc-500 uppercase block text-[10px] font-semibold">
                            Low Stock Alert Limit
                          </label>
                          <input
                            type="number"
                            step="1"
                            min="1"
                            {...register("reorderThreshold", { valueAsNumber: true })}
                            className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded-md text-xs font-semibold h-9"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ACTIONS */}
              <div className="border-t border-zinc-200/80 pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary-modern px-5 py-2.5 text-xs font-semibold uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createProductMutation.isPending}
                  className="btn-primary-modern px-6 py-2.5 font-semibold uppercase text-xs disabled:bg-zinc-300 disabled:cursor-not-allowed"
                >
                  {createProductMutation.isPending ? "Saving..." : "Save Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}