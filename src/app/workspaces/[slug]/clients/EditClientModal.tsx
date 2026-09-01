// src/app/workspaces/[slug]/clients/EditClientModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

interface EditClientModalProps {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    clientType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
    taxPin: string | null;
    requiresEtims?: boolean;
  };
  shopId: string;
  shopSlug: string;
  redirectToDirectoryAfterDelete?: boolean;
  triggerButton?: React.ReactNode;
  customTrigger?: (openModal: () => void) => React.ReactNode;
}

export function EditClientModal({
  client,
  shopId,
  shopSlug,
  redirectToDirectoryAfterDelete,
  triggerButton,
  customTrigger,
}: EditClientModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone || "");
  const [clientType, setClientType] = useState(client.clientType);
  const [taxPin, setTaxPin] = useState(client.taxPin || "");
  const [requiresEtims, setRequiresEtims] = useState(client.requiresEtims || false);
  const [loading, setLoading] = useState(false);

  const updateClientMutation = useUpdateClient(shopId, shopSlug);
  const deleteClientMutation = useDeleteClient(shopId, shopSlug);

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    updateClientMutation.mutate(
      {
        id: client.id,
        name,
        email,
        phone: phone || undefined,
        clientType,
        taxPin: taxPin || undefined,
        requiresEtims,
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
          className="btn-secondary-modern px-2 py-1 text-[10px] font-semibold uppercase"
        >
          Edit Profile
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-2xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-6 relative text-xs animate-in zoom-in-95 duration-150">
            
            <div className="space-y-1">
              <h2 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">Edit Client Profile</h2>
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Update client credentials &amp; PIN</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 font-sans text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Client / Company Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Account Email <span className="text-[9px] text-zinc-400 font-normal">(Optional)</span></label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.com (optional)"
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Contact Telephone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">Category</label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black rounded-md text-xs font-semibold"
                  >
                    <option value="WALK_IN">Walk-In</option>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold text-[10px]">KRA Tax PIN</label>
                  <input
                    type="text"
                    value={taxPin}
                    onChange={(e) => setTaxPin(e.target.value)}
                    placeholder="Sole Prop (A...) or Corp (P...)"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:ring-1 focus:ring-black uppercase text-xs rounded-md font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-zinc-50 border border-zinc-200 rounded-md">
                <input
                  type="checkbox"
                  id="editRequiresEtims"
                  checked={requiresEtims}
                  onChange={(e) => setRequiresEtims(e.target.checked)}
                  className="accent-black w-4 h-4 cursor-pointer rounded"
                />
                <label htmlFor="editRequiresEtims" className="font-semibold uppercase text-[10px] cursor-pointer select-none">
                  Requires KRA eTIMS / CU Fiscal Compliance
                </label>
              </div>

              <div className="border-t border-zinc-200/80 pt-4 flex justify-between items-center">
                {showDeleteConfirm ? (
                  <div className="flex items-center gap-2 animate-in fade-in zoom-in-95">
                    <span className="text-[10px] text-rose-600 font-bold uppercase">Confirm?</span>
                    <button
                      type="button"
                      disabled={deleteClientMutation.isPending}
                      onClick={() => {
                        deleteClientMutation.mutate(client.id, {
                          onSuccess: () => {
                            setIsOpen(false);
                            setShowDeleteConfirm(false);
                            if (redirectToDirectoryAfterDelete) {
                              router.push(`/workspaces/${shopSlug}/clients`);
                            } else {
                              router.refresh();
                            }
                          },
                        });
                      }}
                      className="bg-rose-600 text-white px-3 py-1.5 font-semibold uppercase text-xs rounded-md hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                    >
                      {deleteClientMutation.isPending ? (
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
                    Delete Profile
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
                    disabled={updateClientMutation.isPending}
                    className="btn-primary-modern px-4 py-1.5 text-xs font-semibold uppercase disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {updateClientMutation.isPending ? (
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
