"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { resetPasswordWithToken } from "@/lib/actions/auth-reset";
import Link from "next/link";
import { toast } from "react-hot-toast";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!token) {
      toast.error("Invalid password reset token.");
      return;
    }

    if (password !== confirmPassword) {
      const msg = "Passwords do not match.";
      setError(msg);
      toast.error(msg);
      return;
    }

    if (password.length < 6) {
      const msg = "Password must be at least 6 characters long.";
      setError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    const toastId = toast.loading("Updating password...");

    try {
      const res = await resetPasswordWithToken(token, password);
      setLoading(false);
      if (res.success) {
        toast.success("Password updated successfully!", { id: toastId });
        router.push("/login");
      } else {
        const msg = res.error || "Reset token validation failed.";
        setError(msg);
        toast.error(msg, { id: toastId });
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
          <h2 className="text-xl font-semibold tracking-tight uppercase leading-none font-sans text-black">New Password</h2>
          <p className="text-xs text-zinc-500 font-mono uppercase font-semibold">Enter your new secure account password</p>
        </div>

        {error && (
          <div className="border border-zinc-200 bg-zinc-50 p-3 font-mono text-xs text-black uppercase tracking-tight rounded font-semibold">
            &gt; ERROR: {error}
          </div>
        )}

        {!token ? (
          <div className="space-y-4 font-mono text-xs">
            <div className="border border-rose-200 bg-rose-50 p-4 rounded text-rose-700 uppercase leading-normal">
              &gt; INVALID OR MISSING TOKEN. Please request a new password reset link.
            </div>
            <Link
              href="/forgot-password"
              className="btn-primary-modern block text-center py-2.5 font-semibold uppercase tracking-wider text-xs"
            >
              Request Reset Link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
            <div className="space-y-1">
              <label className="text-zinc-500 uppercase block font-semibold">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-zinc-500 uppercase block font-semibold">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••"
                className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern w-full py-2.5 font-semibold uppercase tracking-wider disabled:bg-zinc-300 text-xs mt-2"
            >
              {loading ? "SAVING PASSWORD..." : "SAVE NEW PASSWORD"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex-1 flex justify-center items-center font-mono text-xs uppercase">Loading password reset portal...</div>
    }>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
