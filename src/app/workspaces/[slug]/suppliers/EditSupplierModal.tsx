// src/app/workspaces/[slug]/suppliers/EditSupplierModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateSupplier, useDeleteSupplier } from "@/hooks/useSuppliers";
import { Spinner } from "@/components/Spinner";

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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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



  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary-modern px-3 py-1 text-xs font-semibold uppercase"
      >
        EDIT VENDOR
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-md shadow-xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-6 font-mono text-xs animate-in zoom-in-95 duration-150 text-left">
            
            <div className="flex justify-between items-start border-b border-zinc-200/80 pb-4">
              <div>
                <h3 className="font-semibold uppercase tracking-tight text-base font-sans text-black">Edit Supplier Profile</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">id: {supplier.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 font-semibold hover:bg-zinc-100 px-2 py-0.5 border border-zinc-300 rounded text-xs"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-black font-semibold uppercase block">Supplier Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Classification</label>
                  <select
                    value={supplierType}
                    onChange={(e) => setSupplierType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
                  >
                    <option value="CORPORATE">Corporate</option>
                    <option value="INDIVIDUAL">Sole Proprietor</option>
                    <option value="WALK_IN">Walk-in / General</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">KRA Tax PIN</label>
                  <input
                    type="text"
                    value={taxPin}
                    onChange={(e) => setTaxPin(e.target.value)}
                    placeholder="Sole Prop (A...) or Corp (P...)"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black uppercase text-xs rounded"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black text-xs font-semibold uppercase rounded"
                >
                  <option value="NET_30">Net 30 Days</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_7">Net 7 Days</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="IMMEDIATE">Immediate Payment</option>
                </select>
              </div>

              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded">
                <input
                  type="checkbox"
                  id="editSupplierRequiresEtims"
                  checked={requiresEtims}
                  onChange={(e) => setRequiresEtims(e.target.checked)}
                  className="accent-black w-4 h-4 cursor-pointer rounded-sm"
                />
                <label htmlFor="editSupplierRequiresEtims" className="font-semibold uppercase text-[10px] cursor-pointer">
                  Requires KRA eTIMS / CU Fiscal Receipt
                </label>
              </div>

              <div className="border-t border-zinc-200/80 pt-4 flex justify-between items-center">
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <span className="text-[10px] text-rose-600 font-bold uppercase">Confirm?</span>
                    <button
                      type="button"
                      disabled={deleteSupplierMutation.isPending}
                      onClick={() => {
                        deleteSupplierMutation.mutate(supplier.id, {
                          onSuccess: () => {
                            setIsOpen(false);
                            setShowDeleteConfirm(false);
                            if (redirectToDirectoryAfterDelete) {
                              router.push(`/workspaces/${shopSlug}/suppliers`);
                            } else {
                              router.refresh();
                            }
                          },
                        });
                      }}
                      className="bg-rose-600 text-white px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {deleteSupplierMutation.isPending ? (
                        <>
                          <Spinner size={10} color="white" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        "Yes, Delete"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(false)}
                      className="bg-zinc-100 text-zinc-500 px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-zinc-200 transition-colors"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border border-rose-200 bg-rose-50 text-rose-600 px-3 py-1.5 font-semibold uppercase hover:bg-rose-600 hover:text-white rounded transition-colors text-xs"
                  >
                    DELETE
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={updateSupplierMutation.isPending}
                    className="btn-primary-modern px-4 py-1.5 text-xs font-semibold uppercase disabled:bg-zinc-300"
                  >
                    {updateSupplierMutation.isPending ? (
                      <span className="flex items-center justify-center gap-1">
                        <Spinner size={10} color="white" />
                        <span>SAVING...</span>
                      </span>
                    ) : (
                      "SAVE"
                    )}
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
