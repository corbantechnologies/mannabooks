// src/app/workspaces/[slug]/suppliers/EditSupplierModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";

interface EditSupplierModalProps {
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    supplierType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
    taxPin: string | null;
    requiresEtims?: boolean;
    paymentTerms?: string | null;
  };
  shopId: string;
  shopSlug: string;
  redirectToDirectoryAfterDelete?: boolean;
}

export function EditSupplierModal({
  supplier,
  shopId,
  shopSlug,
  redirectToDirectoryAfterDelete,
}: EditSupplierModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(supplier.name);
  const [email, setEmail] = useState(supplier.email);
  const [phone, setPhone] = useState(supplier.phone || "");
  const [supplierType, setSupplierType] = useState(supplier.supplierType);
  const [taxPin, setTaxPin] = useState(supplier.taxPin || "");
  const [requiresEtims, setRequiresEtims] = useState(supplier.requiresEtims || false);
  const [paymentTerms, setPaymentTerms] = useState(supplier.paymentTerms || "NET_30");

  const updateSupplierMutation = useUpdateSupplier(shopId, shopSlug);
  const deleteSupplierMutation = useDeleteSupplier(shopId, shopSlug);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    updateSupplierMutation.mutate(
      {
        id: supplier.id,
        name,
        email,
        phone: phone || undefined,
        supplierType,
        taxPin: taxPin || undefined,
        requiresEtims,
        paymentTerms,
      },
      {
        onSuccess: () => {
          setIsOpen(false);
          router.refresh();
        },
      }
    );
  }

  async function handleDelete() {
    if (!confirm(`Are you sure you want to delete supplier "${supplier.name}"? This action cannot be undone.`)) {
      return;
    }

    deleteSupplierMutation.mutate(supplier.id, {
      onSuccess: () => {
        setIsOpen(false);
        if (redirectToDirectoryAfterDelete) {
          router.push(`/workspaces/${shopSlug}/suppliers`);
        } else {
          router.refresh();
        }
      },
    });
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="border border-black bg-white px-3 py-1 font-mono text-xs font-bold uppercase hover:bg-black hover:text-white transition-colors"
      >
        EDIT VENDOR
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-6 font-mono text-xs shadow-lg animate-in fade-in duration-150 text-left">
            
            <div className="flex justify-between items-start border-b border-black pb-4">
              <div>
                <h3 className="font-bold uppercase tracking-tight text-base">Edit Supplier Profile</h3>
                <p className="text-[10px] text-zinc-400 uppercase">id: {supplier.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-black font-bold hover:bg-zinc-100 px-2 py-0.5 border border-black text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-black font-bold uppercase block">Supplier Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px]">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px]">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px]">Classification</label>
                  <select
                    value={supplierType}
                    onChange={(e) => setSupplierType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="CORPORATE">Corporate</option>
                    <option value="INDIVIDUAL">Sole Proprietor</option>
                    <option value="WALK_IN">Walk-in / General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px]">KRA Tax PIN</label>
                  <input
                    type="text"
                    value={taxPin}
                    onChange={(e) => setTaxPin(e.target.value)}
                    placeholder="Sole Prop (A...) or Corp (P...)"
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black uppercase text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block text-[10px]">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs font-bold uppercase"
                >
                  <option value="NET_30">Net 30 Days</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_7">Net 7 Days</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="IMMEDIATE">Immediate Payment</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-black">
                <input
                  type="checkbox"
                  id="editSupplierRequiresEtims"
                  checked={requiresEtims}
                  onChange={(e) => setRequiresEtims(e.target.checked)}
                  className="accent-black w-4 h-4 cursor-pointer"
                />
                <label htmlFor="editSupplierRequiresEtims" className="font-bold uppercase text-[10px] cursor-pointer">
                  Requires KRA eTIMS / CU Fiscal Receipt
                </label>
              </div>

              <div className="border-t border-black pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleteSupplierMutation.isPending}
                  className="border border-rose-600 text-rose-600 px-3 py-1.5 font-bold uppercase hover:bg-rose-600 hover:text-white transition-colors"
                >
                  DELETE
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="border border-zinc-300 px-3 py-1.5 text-zinc-600 hover:border-black hover:text-black transition-colors"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={updateSupplierMutation.isPending}
                    className="bg-black text-white px-4 py-1.5 font-bold uppercase hover:bg-zinc-900 transition-colors disabled:bg-zinc-300"
                  >
                    {updateSupplierMutation.isPending ? "SAVING..." : "SAVE"}
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}
    </>
  );
}
