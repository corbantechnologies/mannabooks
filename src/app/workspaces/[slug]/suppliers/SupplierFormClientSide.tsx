// src/app/workspaces/[slug]/suppliers/SupplierFormClientSide.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateSupplier } from "@/hooks/useSuppliers";

const supplierSchema = z.object({
  name: z.string().min(2, "Supplier name must be at least 2 characters."),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  phone: z.string().optional(),
  supplierType: z.enum(["WALK_IN", "INDIVIDUAL", "CORPORATE"]),
  taxPin: z.string().optional(),
  requiresEtims: z.boolean(),
  paymentTerms: z.string(),
});

type SupplierFormData = z.infer<typeof supplierSchema>;

export function SupplierFormClientSide({
  shopId,
  shopSlug,
}: {
  shopId: string;
  shopSlug: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const createSupplierMutation = useCreateSupplier(shopId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      supplierType: "CORPORATE",
      taxPin: "",
      requiresEtims: false,
      paymentTerms: "NET_30",
    },
  });

  const supplierType = watch("supplierType");

  function onSubmit(data: SupplierFormData) {
    createSupplierMutation.mutate(
      {
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        supplierType: data.supplierType,
        taxPin: data.taxPin || undefined,
        requiresEtims: data.requiresEtims,
        paymentTerms: data.paymentTerms,
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
        className="btn-primary-modern px-4 py-2 text-xs uppercase tracking-wider"
      >
        + Register Supplier / Vendor
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-2xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in zoom-in-95 duration-150 relative">
            <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-semibold uppercase tracking-tight text-base font-sans text-black">
                  Register Vendor / Supplier
                </h3>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">
                  Inbound Procurement Entity Entry
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-sans text-xs">
              {/* CLASSIFICATION TYPE SELECTOR */}
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block text-[10px] font-semibold">
                  Vendor Classification
                </label>
                <div className="grid grid-cols-3 border border-zinc-200 divide-x divide-zinc-200 bg-white rounded-md overflow-hidden">
                  {(["CORPORATE", "INDIVIDUAL", "WALK_IN"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setValue("supplierType", type)}
                      className={`py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                        supplierType === type
                          ? "bg-emerald-900 text-white"
                          : "bg-white text-zinc-600 hover:bg-zinc-50"
                      }`}
                    >
                      {type === "CORPORATE"
                        ? "Corporate"
                        : type === "INDIVIDUAL"
                        ? "Sole Prop"
                        : "Walk-in"}
                    </button>
                  ))}
                </div>
              </div>

              {/* NAME & CONTACT */}
              <div className="space-y-1">
                <label className="text-black font-semibold uppercase block text-[10px]">
                  Supplier / Company Name *
                </label>
                <input
                  type="text"
                  {...register("name")}
                  placeholder="e.g. Metro Distributors LTD"
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-md text-xs font-semibold"
                />
                {errors.name && (
                  <p className="text-[10px] text-rose-600 font-semibold">{errors.name.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">
                    Email Address{" "}
                    <span className="text-[9px] text-zinc-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="orders@vendor.com"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-md text-xs"
                  />
                  {errors.email && (
                    <p className="text-[10px] text-rose-600 font-semibold">
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">
                    Phone Contact
                  </label>
                  <input
                    type="text"
                    {...register("phone")}
                    placeholder="e.g. 0712345678"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              {/* FLEXIBLE TAX PIN */}
              <div className="space-y-1 pt-2 border-t border-dashed border-zinc-200">
                <div className="flex justify-between items-center">
                  <label className="text-black font-semibold uppercase block text-[10px]">
                    KRA Tax PIN
                  </label>
                  <span className="text-[9px] text-zinc-400 italic font-mono">
                    Sole Prop (A...) or Corp (P...)
                  </span>
                </div>
                <input
                  type="text"
                  {...register("taxPin")}
                  placeholder="e.g. A012345678B or P051234567A"
                  className="w-full px-3 py-2 border border-zinc-300 bg-white font-mono text-xs uppercase focus:outline-none focus:ring-1 focus:ring-black placeholder:text-zinc-300 rounded-md"
                  maxLength={20}
                />
              </div>

              {/* PAYMENT TERMS SELECTOR */}
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block text-[10px] font-semibold">
                  Payment Terms
                </label>
                <select
                  {...register("paymentTerms")}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs font-semibold uppercase rounded-md"
                >
                  <option value="NET_30">Net 30 Days</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_7">Net 7 Days</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="IMMEDIATE">Immediate Payment</option>
                </select>
              </div>

              {/* STATUTORY eTIMS FISCAL REQUIREMENT TOGGLE */}
              <div className="flex items-center gap-2.5 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                <input
                  type="checkbox"
                  id="supplierRequiresEtims"
                  {...register("requiresEtims")}
                  className="accent-black w-4 h-4 cursor-pointer rounded"
                />
                <label
                  htmlFor="supplierRequiresEtims"
                  className="font-semibold uppercase text-[10px] cursor-pointer select-none"
                >
                  Requires KRA eTIMS / CU Fiscal Receipt
                </label>
              </div>

              {/* BUTTONS */}
              <div className="border-t border-zinc-200/80 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary-modern px-4 py-2 text-xs uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={createSupplierMutation.isPending}
                  className="btn-primary-modern px-4 py-2 text-xs uppercase disabled:bg-zinc-300"
                >
                  {createSupplierMutation.isPending ? "REGISTERING..." : "COMMIT SUPPLIER"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
