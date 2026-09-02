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
  triggerButton?: React.ReactNode;
  customTrigger?: (openModal: () => void) => React.ReactNode;
}

export function EditSupplierModal({
  supplier,
  shopId,
  shopSlug,
  redirectToDirectoryAfterDelete,
  triggerButton,
  customTrigger,
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
      {customTrigger ? (
        customTrigger(() => setIsOpen(true))
      ) : triggerButton ? (
        <span onClick={() => setIsOpen(true)} className="cursor-pointer">
          {triggerButton}
        </span>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-secondary-modern px-3 py-1 text-xs font-semibold uppercase"
        >
          EDIT VENDOR
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-2xl w-[95%] sm:w-full max-w-md max-h-[90vh] overflow-y-auto p-6 space-y-6 animate-in zoom-in-95 duration-150 text-left">
            
            <div className="flex justify-between items-start border-b border-zinc-200/80 pb-4">
              <div>
                <h3 className="font-semibold uppercase tracking-tight text-base font-sans text-black">Edit Supplier Profile</h3>
                <p className="text-[10px] text-zinc-400 uppercase font-semibold">id: {supplier.id}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-400 hover:text-black font-bold text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-black font-semibold uppercase block text-[10px]">Supplier Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Email <span className="font-normal">(Optional)</span></label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="orders@vendor.com (optional)"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Classification</label>
                  <select
                    value={supplierType}
                    onChange={(e) => setSupplierType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-semibold"
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
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black uppercase text-xs rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black text-xs font-semibold uppercase rounded-md"
                >
                  <option value="NET_30">Net 30 Days</option>
                  <option value="NET_15">Net 15 Days</option>
                  <option value="NET_7">Net 7 Days</option>
                  <option value="COD">Cash on Delivery (COD)</option>
                  <option value="IMMEDIATE">Immediate Payment</option>
                </select>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                <input
                  type="checkbox"
                  id="editSupplierRequiresEtims"
                  checked={requiresEtims}
                  onChange={(e) => setRequiresEtims(e.target.checked)}
                  className="accent-black w-4 h-4 cursor-pointer rounded"
                />
                <label htmlFor="editSupplierRequiresEtims" className="font-semibold uppercase text-[10px] cursor-pointer select-none">
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
                      className="bg-rose-600 text-white px-3 py-1.5 font-semibold uppercase text-xs rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
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
                      className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase"
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 px-3 py-1.5 font-semibold uppercase text-xs rounded-md transition-colors"
                  >
                    Delete Vendor
                  </button>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateSupplierMutation.isPending}
                    className="btn-primary-modern px-4 py-1.5 text-xs font-semibold uppercase disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {updateSupplierMutation.isPending ? (
                      <>
                        <Spinner size={10} color="white" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      "Save"
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
