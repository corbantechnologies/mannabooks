// src/app/offline/page.tsx
import Link from "next/link";

export default function OfflineFallbackPage() {
  return (
    <div className="min-h-screen bg-white text-black font-mono flex flex-col justify-center items-center p-8 selection:bg-black selection:text-white">
      <div className="max-w-md w-full border border-black p-8 bg-zinc-50 space-y-6 text-center shadow-sm">
        <div className="inline-block border border-black bg-black text-white px-3 py-1 font-bold text-xs uppercase tracking-widest">
          ⚠️ CONNECTION UNREACHABLE
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold uppercase tracking-tight">Offline Mode Active</h1>
          <p className="font-sans text-xs text-zinc-600">
            Manna Books cannot establish a live connection to your backend server. Please verify your internet or network state.
          </p>
        </div>

        <div className="pt-4 border-t border-zinc-300 flex flex-col gap-3">
          <a
            href="/workspaces"
            className="border border-black bg-black text-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors block"
          >
            🔄 Re-attempt Connection
          </a>
          <span className="text-[10px] text-zinc-400 uppercase">Local Cache Active</span>
        </div>
      </div>
    </div>
  );
}
