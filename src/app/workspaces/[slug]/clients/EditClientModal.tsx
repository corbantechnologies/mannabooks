// src/app/workspaces/[slug]/clients/EditClientModal.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUpdateClient, useDeleteClient } from "@/hooks/useClients";
import { toast } from "react-hot-toast";

interface EditClientModalProps {
  client: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    clientType: "WALK_IN" | "INDIVIDUAL" | "CORPORATE";
    taxPin: string | null;
  };
  shopId: string;
  shopSlug: string;
  redirectToDirectoryAfterDelete?: boolean;
}

export function EditClientModal({ client, shopId, shopSlug, redirectToDirectoryAfterDelete }: EditClientModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(client.name);
  const [email, setEmail] = useState(client.email);
  const [phone, setPhone] = useState(client.phone || "");
  const [clientType, setClientType] = useState(client.clientType);
  const [taxPin, setTaxPin] = useState(client.taxPin || "");
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
    if (!confirm(`Are you sure you want to delete client "${client.name}"?`)) return;
    deleteClientMutation.mutate(client.id, {
      onSuccess: () => {
        setIsOpen(false);
        if (redirectToDirectoryAfterDelete) {
          router.push(`/workspaces/${shopSlug}/clients`);
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
        className="border border-black px-2 py-1 text-[10px] font-bold uppercase hover:bg-black hover:text-white transition-colors"
      >
        Edit Profile
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-black w-[95%] sm:w-full max-w-sm max-h-[90vh] overflow-y-auto p-4 sm:p-6 space-y-6 relative font-mono text-xs">
            
            <div className="space-y-1">
              <h2 className="text-xl font-bold uppercase tracking-tight">Edit Client Profile</h2>
              <p className="text-[10px] text-zinc-400 uppercase">Update client credentials &amp; PIN</p>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">Client / Company Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">Account Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-zinc-400 uppercase block">Contact Telephone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Category</label>
                  <select
                    value={clientType}
                    onChange={(e) => setClientType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="WALK_IN">Walk-In</option>
                    <option value="INDIVIDUAL">Individual</option>
                    <option value="CORPORATE">Corporate</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block">Tax PIN</label>
                  <input
                    type="text"
                    value={taxPin}
                    onChange={(e) => setTaxPin(e.target.value)}
                    className="w-full px-3 py-2 border border-black bg-white focus:outline-none focus:ring-1 focus:ring-black uppercase"
                  />
                </div>
              </div>

              <div className="border-t border-black pt-4 flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleDelete}
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
                    disabled={loading}
                    className="bg-black text-white px-4 py-1.5 font-bold uppercase hover:bg-zinc-900 transition-colors disabled:bg-zinc-300"
                  >
                    {loading ? "SAVING..." : "SAVE"}
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
