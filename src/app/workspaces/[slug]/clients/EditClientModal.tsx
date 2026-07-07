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
}

export function EditClientModal({ client, shopId, shopSlug, redirectToDirectoryAfterDelete }: EditClientModalProps) {
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
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary-modern px-2 py-1 text-[10px] font-semibold uppercase"
      >
        Edit Profile
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-md shadow-xl w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-6 relative font-mono text-xs animate-in zoom-in-95 duration-150">
            
            <div className="space-y-1">
              <h2 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">Edit Client Profile</h2>
              <p className="text-[10px] text-zinc-400 uppercase font-semibold">Update client credentials &amp; PIN</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4 font-mono text-xs">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Client / Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Account Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block font-semibold">Contact Telephone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">Category</label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs font-semibold"
                  >
                    <option value="WALK_IN">Walk-In</option>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block font-semibold">KRA Tax PIN</label>
                  <input
                    type="text"
                    value={taxPin}
                    onChange={(e) => setTaxPin(e.target.value)}
                    placeholder="Sole Prop (A...) or Corp (P...)"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black uppercase text-xs rounded"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded">
                <input
                  type="checkbox"
                  id="editRequiresEtims"
                  checked={requiresEtims}
                  onChange={(e) => setRequiresEtims(e.target.checked)}
                  className="accent-black w-4 h-4 cursor-pointer rounded-sm"
                />
                <label htmlFor="editRequiresEtims" className="font-semibold uppercase text-[10px] cursor-pointer">
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
                      className="bg-rose-600 text-white px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-rose-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
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
                    disabled={loading}
                    className="btn-primary-modern px-4 py-1.5 text-xs font-semibold uppercase disabled:bg-zinc-300"
                  >
                    {loading ? (
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
