// src/app/offline/page.tsx
import Link from "next/link";

export default function OfflineFallbackPage() {
  return (
    <div className="min-h-screen bg-white text-black font-mono flex flex-col justify-center items-center p-8 selection:bg-black selection:text-white">
      <div className="max-w-md w-full card-modern p-8 bg-white space-y-6 text-center shadow-sm">
        <div className="inline-block border border-amber-300 bg-amber-50 text-amber-900 px-3 py-1 font-semibold text-xs uppercase tracking-wider rounded">
          ⚠️ CONNECTION UNREACHABLE
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-semibold uppercase tracking-tight font-sans text-black">Offline Mode Active</h1>
          <p className="font-sans text-xs text-zinc-600">
            Manna Books cannot establish a live connection to your backend server. Please verify your internet or network state.
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-200/80 flex flex-col gap-3">
          <a
            href="/workspaces"
            className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider block text-center"
          >
            🔄 Re-attempt Connection
          </a>
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">Local Cache Active</span>
        </div>
      </div>
    </div>
  );
}
