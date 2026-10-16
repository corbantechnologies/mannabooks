// src/app/(auth)/login/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";
import { loginUser } from "@/lib/actions/auth-login";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawCallback = searchParams.get("callbackUrl");
  // Only same-site relative paths are allowed (blocks open redirects such as //evil.com).
  const callbackUrl =
    rawCallback &&
    rawCallback.startsWith("/") &&
    !rawCallback.startsWith("//") &&
    !rawCallback.startsWith("/\\") &&
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

  function handleClearSession() {
    setIsClearing(true);
    // The session cookie is HttpOnly; /logout clears it server-side.
    window.location.href = "/logout";
  }

  async function onSubmit(data: LoginFormData) {
    setError(null);
    setLoading(true);
    const toastId = toast.loading("Authenticating credentials...");

    try {
      const res = await loginUser({ email: data.email, password: data.password });
      if (!res.success) {
        const msg = res.error || "Invalid email or password.";
        setError(msg);
        toast.error(msg, { id: toastId });
        setLoading(false);
        return;
      }

      toast.success("Login successful!", { id: toastId });
      window.location.href = callbackUrl;
    } catch (err: any) {
      console.error("Login authentication error:", err);
      const msg = "An unexpected error occurred. Please try again.";
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

        {searchParams.get("expired") === "1" && !error && (
          <div className="border border-amber-200 bg-amber-50 p-3 font-sans text-xs text-amber-800 rounded font-semibold">
            Your session ended after a period of inactivity. Please log in again.
          </div>
        )}

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