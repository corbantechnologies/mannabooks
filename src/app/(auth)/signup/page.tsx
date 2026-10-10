// src/app/(auth)/signup/page.tsx
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
import axiosClient from "@/lib/api/axios";

const signupSchema = z.object({
  name: z.string().min(2, "Full legal name is required."),
  email: z.string().email("Please enter a valid email address."),
  businessName: z.string().min(2, "Business entity name is required."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center font-mono text-xs text-zinc-500">
          Loading registration portal...
        </div>
      }
    >
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      businessName: "",
      password: "",
    },
  });

  async function onSubmit(data: SignupFormData) {
    setError(null);
    setLoading(true);
    const toastId = toast.loading("Compiling profile & workspace...");

    try {
      // 1. Direct Axios call to FastAPI auth register endpoint
      const response: any = await axiosClient.post("/auth/register", {
        name: data.name.trim(),
        email: data.email.toLowerCase().trim(),
        password: data.password,
        business_name: data.businessName.trim(),
        invite_token: inviteToken || null,
      });

      if (!response.success && response.error) {
        throw new Error(response.error);
      }

      toast.success("Account & workspace created successfully!", { id: toastId });

      // 2. Establish Next-Auth session
      const authRes = await signIn("credentials", {
        email: data.email.toLowerCase().trim(),
        password: data.password,
        redirect: false,
      });

      if (authRes?.error) {
        console.warn("NextAuth session establishment warning:", authRes.error);
      }

      // 3. Persist session token if returned
      const token = response.token;
      if (token && typeof window !== "undefined") {
        localStorage.setItem("manna_auth_token", token);
        document.cookie = `manna_session_token=${token}; path=/; max-age=2592000; SameSite=Lax`;
        document.cookie = `kenya-nzuri-kabisa=${token}; path=/; max-age=2592000; SameSite=Lax`;
      }

      const shopSlug = response.shop_slug || response.shopSlug;
      if (inviteToken) {
        window.location.href = "/dashboard";
      } else if (shopSlug) {
        window.location.href = `/workspaces/${shopSlug}`;
      } else {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      console.error("Signup execution error:", err);
      const msg = err?.message || "An unexpected error occurred during account creation.";
      setError(msg);
      toast.error(msg, { id: toastId });
      setLoading(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-6 py-12 bg-white text-black selection:bg-black selection:text-white">
      <div className="card-modern w-full max-w-md p-8 space-y-6 bg-white">
        <div className="space-y-1.5">
          <Link
            href="/"
            className="font-sans text-xs font-semibold text-zinc-400 hover:text-black inline-flex items-center gap-1 hover:underline transition-colors mb-1"
          >
            ← Back to Home
          </Link>
          <h2 className="text-xl font-semibold tracking-tight uppercase leading-none font-sans text-black">
            Create Account
          </h2>
          <p className="text-xs text-zinc-500 font-sans">
            Create your account to set up your business workspace
          </p>
        </div>

        {error && (
          <div className="border border-rose-200 bg-rose-50 p-3 font-sans text-xs text-rose-800 rounded font-semibold">
            ⚠ {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 font-mono text-xs">
          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Full Legal Name</label>
            <input
              type="text"
              {...register("name")}
              placeholder="e.g., John Doe"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
            />
            {errors.name && (
              <p className="text-[10px] text-rose-600 font-sans font-semibold mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">Email Address</label>
            <input
              type="email"
              {...register("email")}
              placeholder="e.g., owner@company.com"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
            />
            {errors.email && (
              <p className="text-[10px] text-rose-600 font-sans font-semibold mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">
              {inviteToken ? "Optional: Business Name" : "Business / Store Entity Name"}
            </label>
            <input
              type="text"
              {...register("businessName")}
              placeholder="e.g., Manna Hardware"
              className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
            />
            {errors.businessName && (
              <p className="text-[10px] text-rose-600 font-sans font-semibold mt-1">
                {errors.businessName.message}
              </p>
            )}
            {inviteToken && (
              <p className="text-[10px] text-zinc-400 mt-1">
                Leave blank to skip creating your own workspace.
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-zinc-500 uppercase block font-semibold">
              Master Account Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                {...register("password")}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 pr-12 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
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
                <span>COMPILING REGISTRY...</span>
              </span>
            ) : (
              "CREATE MASTER PROFILE"
            )}
          </button>
        </form>

        <div className="border-t border-zinc-200/80 pt-4 font-mono text-xs text-center">
          <span className="text-zinc-400">Already registered? </span>
          <Link
            href="/login"
            className="font-semibold text-black underline hover:no-underline uppercase"
          >
            Log In
          </Link>
        </div>
      </div>
    </div>
  );
}