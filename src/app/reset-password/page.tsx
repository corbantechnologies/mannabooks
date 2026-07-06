"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { resetPasswordWithToken } from "@/lib/actions/auth-reset";
import Link from "next/link";

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (!token) {
            setStatus("ERROR");
            setErrorMessage("Invalid or missing reset token.");
        }
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        
        if (!token) return;

        if (password.length < 8) {
            setStatus("ERROR");
            setErrorMessage("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setStatus("ERROR");
            setErrorMessage("Passwords do not match.");
            return;
        }

        setStatus("LOADING");
        setErrorMessage("");

        const res = await resetPasswordWithToken(token, password);

        if (res.success) {
            setStatus("SUCCESS");
        } else {
            setStatus("ERROR");
            setErrorMessage(res.error || "An unexpected error occurred.");
        }
    }

    if (status === "SUCCESS") {
        return (
            <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-lg text-emerald-900 text-center">
                <div className="flex justify-center mb-4 text-emerald-500">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <p className="font-bold mb-2">Password Reset Successful</p>
                <p className="text-sm mb-6">Your account has been securely updated.</p>
                <Link href="/login" className="bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors inline-block w-full">
                    Return to Login
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {status === "ERROR" && (
                <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-900 text-xs font-semibold">
                    {errorMessage}
                </div>
            )}

            <div className="space-y-4">
                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider">
                        New Password
                    </label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                        placeholder="••••••••"
                        required
                        disabled={!token || status === "LOADING"}
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-black uppercase tracking-wider">
                        Confirm Password
                    </label>
                    <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                        placeholder="••••••••"
                        required
                        disabled={!token || status === "LOADING"}
                    />
                </div>
            </div>

            <button
                type="submit"
                disabled={!token || status === "LOADING"}
                className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 flex justify-center items-center h-12"
            >
                {status === "LOADING" ? (
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    "Update Password"
                )}
            </button>
        </form>
    );
}

export default function ResetPasswordPage() {
    return (
        <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 font-sans selection:bg-black selection:text-white">
            <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-xl p-8 shadow-sm">
                
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-lg mb-4 shadow-sm">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0110 0v4"></path>
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-black mb-2">Create New Password</h1>
                    <p className="text-sm text-zinc-500 font-mono">
                        Your new password must be securely configured.
                    </p>
                </div>

                <Suspense fallback={<div className="text-center text-sm font-semibold text-zinc-500 animate-pulse">Loading secure environment...</div>}>
                    <ResetPasswordForm />
                </Suspense>
            </div>
        </main>
    );
}
