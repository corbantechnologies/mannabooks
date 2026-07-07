"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth-reset";
import Link from "next/link";
import { toast } from "react-hot-toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const toastId = toast.loading("Sending reset instructions...");

    try {
      const res = await requestPasswordReset(email);
      setLoading(false);
      if (res.success) {
        setSent(true);
        toast.success("Reset link sent to email!", { id: toastId });
      } else {
        toast.error(res.error || "Failed to process request.", { id: toastId });
      }
    } catch (err) {
      setLoading(false);
      toast.error("An unexpected error occurred.", { id: toastId });
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white selection:bg-black selection:text-white">
      <div className="card-modern w-full max-w-sm p-8 space-y-6 bg-white">
        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight uppercase leading-none font-sans text-black">Reset Password</h2>
          <p className="text-xs text-zinc-500 font-mono uppercase font-semibold">Enter email to request reset link</p>
        </div>

        {sent ? (
          <div className="space-y-4 font-mono text-xs">
            <div className="border border-black bg-zinc-50 p-4 rounded uppercase text-black leading-normal">
              &gt; CHECK YOUR EMAIL BOX. If the email exists on Manna Books, you will receive a secure reset link shortly.
            </div>
            <Link
              href="/login"
              className="btn-primary-modern block text-center py-2.5 font-semibold uppercase tracking-wider text-xs"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-zinc-500 uppercase block font-semibold">Account Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. user@domain.com"
                className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern w-full py-2.5 font-semibold uppercase tracking-wider disabled:bg-zinc-300 text-xs mt-2"
            >
              {loading ? "SENDING LINK..." : "REQUEST RESET LINK"}
            </button>

            <div className="border-t border-zinc-200/80 pt-4 text-center">
              <Link href="/login" className="font-semibold text-zinc-400 hover:text-black hover:underline uppercase text-[10px]">
                Return to Login
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
