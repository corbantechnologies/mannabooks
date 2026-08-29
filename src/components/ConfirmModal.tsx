"use client";

import { useEffect } from "react";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary" | "warning";
  isLoading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmModalProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen && !isLoading) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const confirmBtnStyles =
    variant === "danger"
      ? "bg-rose-600 hover:bg-rose-700 text-white"
      : variant === "warning"
      ? "bg-amber-600 hover:bg-amber-700 text-white"
      : "bg-black hover:bg-zinc-800 text-white";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
      <div
        className="bg-white border border-zinc-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 animate-in zoom-in-95 font-sans"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-start">
          <h3 className="text-base font-bold text-black uppercase tracking-tight">
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="text-zinc-400 hover:text-black font-bold p-1 text-sm transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-zinc-600 font-sans leading-relaxed">
          {message}
        </p>

        <div className="pt-3 border-t border-zinc-100 flex justify-end gap-2 font-mono text-xs">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 border border-zinc-300 hover:bg-zinc-100 font-bold uppercase text-[11px] rounded-lg transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`font-bold uppercase text-[11px] px-4 py-2 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5 ${confirmBtnStyles}`}
          >
            {isLoading && (
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            )}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
