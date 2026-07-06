"use client";

import { useState } from "react";
import { requestPasswordReset } from "@/lib/actions/auth-reset";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [status, setStatus] = useState<"IDLE" | "LOADING" | "SUCCESS" | "ERROR">("IDLE");
    const [errorMessage, setErrorMessage] = useState("");

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("LOADING");
        setErrorMessage("");

        const res = await requestPasswordReset(email);

        if (res.success) {
            setStatus("SUCCESS");
        } else {
            setStatus("ERROR");
            setErrorMessage(res.error || "An unexpected error occurred.");
        }
    }

    return (
        <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-4 font-sans selection:bg-black selection:text-white">
            <div className="w-full max-w-md bg-white border border-zinc-200/80 rounded-xl p-8 shadow-sm">
                
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-12 h-12 bg-black text-white rounded-lg mb-4 shadow-sm">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-black tracking-tight text-black mb-2">Reset Password</h1>
                    <p className="text-sm text-zinc-500 font-mono">
                        Enter your email to receive a recovery link.
                    </p>
                </div>

                {status === "SUCCESS" ? (
                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg text-emerald-900 mb-6 text-sm text-center">
                        <p className="font-bold mb-2">Check your inbox</p>
                        <p>If an account exists for <strong>{email}</strong>, a recovery link has been sent.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {status === "ERROR" && (
                            <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-900 text-xs font-semibold">
                                {errorMessage}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-xs font-bold text-black uppercase tracking-wider">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-black transition-all"
                                placeholder="name@company.com"
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={status === "LOADING"}
                            className="w-full bg-black hover:bg-zinc-800 text-white font-bold py-3 px-4 rounded-lg text-sm transition-colors disabled:opacity-50 flex justify-center items-center h-12"
                        >
                            {status === "LOADING" ? (
                                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                            ) : (
                                "Send Recovery Link"
                            )}
                        </button>
                    </form>
                )}

                <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
                    <Link href="/login" className="text-xs font-semibold text-zinc-500 hover:text-black transition-colors">
                        ← Back to secure login
                    </Link>
                </div>
            </div>
        </main>
    );
}
