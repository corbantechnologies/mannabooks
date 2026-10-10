"use client";

import { handleClientLogout } from "@/lib/auth/client-logout";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => handleClientLogout()}
      className={
        className ||
        "text-rose-500 hover:text-rose-400 text-[10px] font-semibold uppercase tracking-wide transition-colors cursor-pointer bg-transparent border-none"
      }
    >
      Sign out
    </button>
  );
}
