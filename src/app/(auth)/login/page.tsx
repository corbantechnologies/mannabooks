// src/app/(auth)/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn, getSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  const callbackUrl =
    rawCallback &&
    !rawCallback.startsWith("/login") &&
    !rawCallback.startsWith("/signup") &&
    !rawCallback.startsWith("/logout")
      ? rawCallback
      : "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function handleClearSession() {
    setIsClearing(true);
    const toastId = toast.loading("Clearing session cookies...");
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem("manna_auth_token");
        document.cookie.split(";").forEach((c) => {
          document.cookie = c
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
        });
      }
      toast.success("Session cookies wiped cleanly. You can now log in.", { id: toastId });
      setError(null);
    } catch {
      toast.error("Failed to clear cookies.", { id: toastId });
    } finally {
      setIsClearing(false);
    }
  }

  async function onSubmit(data: LoginFormData) {
    setError(null);
    setLoading(true);
    const toastId = toast.loading("Authenticating credentials...");

    try {
      const res = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (res?.error) {
        const msg = res.error || "Authentication handshake rejected.";
        setError(msg);
        toast.error(msg, { id: toastId });
        setLoading(false);
        return;
      }

      // Synchronize client access token for Axios calls
      const session = await getSession();
      const token = (session?.user as any)?.accessToken;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("manna_auth_token", token);
        document.cookie = `manna_session_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `kenya-nzuri-kabisa=${token}; path=/; max-age=2592000; SameSite=Lax`;
      }

      toast.success("Login successful!", { id: toastId });
      window.location.href = callbackUrl;
    } catch (err: any) {
      console.error("Login authentication error:", err);
      const msg = err?.message || "An unexpected error occurred. Please try again.";
      setError(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white selection:bg-black selection:text-white">
      <div className="card-modern w-full max-w-sm p-8 space-y-6 bg-white">
        <div className="space-y-1.5">
          <Link
            href="/"
            className="font-sans text-xs font-semibold text-zinc-400 hover:text-black inline-flex items-center gap-1 hover:underline transition-colors mb-1"
          >
            ← Back to Home
          </Link>
          <h2 className="text-xl font-semibold tracking-tight uppercase leading-none font-sans text-black">
            Log In
          </h2>
          <p className="text-xs text-zinc-500 font-sans">
            Enter your credentials to access your account
          </p>
        </div>

        {searchParams.get("cleared") === "1" && !error && (
          <div className="border border-emerald-200 bg-emerald-50 p-3 font-sans text-xs text-emerald-800 rounded font-semibold flex items-center gap-2">
            <span>✓</span>
            <span>Session cookies cleared cleanly. Please enter your credentials to log in.</span>
          </div>
        )}

        {error && (
          <div className="border border-rose-200 bg-rose-50 p-3 font-sans text-xs text-rose-800 rounded font-semibold">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Account Email</label>
            <input
              type="email"
              {...register("email")}
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
              placeholder="operator@company.com"
            />
            {errors.email && (
              <p className="text-[10px] text-rose-600 font-sans font-semibold mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-zinc-500 uppercase block font-semibold">
                Account Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[10px] text-zinc-400 hover:text-black hover:underline uppercase font-semibold"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                className="w-full px-3 py-2 pr-12 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-[10px] text-zinc-400 hover:text-black font-semibold uppercase select-none cursor-pointer"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {errors.password && (
              <p className="text-[10px] text-rose-600 font-sans font-semibold mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary-modern w-full py-2.5 font-semibold uppercase tracking-wider disabled:bg-zinc-300 text-xs mt-2"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner size={14} />
                <span>AUTHENTICATING...</span>
              </span>
            ) : (
              "LOG IN TO CONSOLE"
            )}
          </button>
        </form>

        <div className="border-t border-zinc-200/80 pt-4 font-mono text-xs text-center space-y-2">
          <div>
            <span className="text-zinc-400">New operator? </span>
            <Link
              href="/signup"
              className="font-semibold text-black underline hover:no-underline uppercase"
            >
              Initialize Account
            </Link>
          </div>
          <div>
            <button
              type="button"
              onClick={handleClearSession}
              disabled={isClearing}
              className="text-[10px] text-zinc-400 hover:text-rose-600 transition-colors uppercase tracking-wider underline cursor-pointer"
            >
              {isClearing ? "Clearing..." : "Having login issues? Clear stale session cookies"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex-1 flex justify-center items-center font-mono text-xs uppercase">
          Loading login portal...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}