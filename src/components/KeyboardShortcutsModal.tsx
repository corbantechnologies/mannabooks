"use client";

import { useEffect, useState } from "react";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  slug: string;
}

const SHORTCUT_CATEGORIES = [
  {
    category: "Primary Creation & Billing",
    shortcuts: [
      { key: "N", description: "Create New Financial Document / Invoice" },
      { key: "B", description: "View All Billing Documents & Invoices" },
      { key: "R", description: "Recurring Invoices Management" },
    ],
  },
  {
    category: "Workspace Navigation",
    shortcuts: [
      { key: "O or D", description: "Workspace Overview Dashboard" },
      { key: "A", description: "Advanced Analytics & Financial Intelligence" },
      { key: "P", description: "Product & Services Catalog" },
      { key: "E", description: "Operating Expenses Ledger" },
      { key: "I", description: "Shared Team Inbox" },
      { key: "C", description: "Client Accounts Registry" },
      { key: "S", description: "Supplier Accounts Registry" },
    ],
  },
  {
    category: "Global & Dialogs",
    shortcuts: [
      { key: "[ or Ctrl+B", description: "Collapse or Expand Desktop Sidebar" },
      { key: "?", description: "Open this Keyboard Shortcuts Reference" },
      { key: "Esc", description: "Close active modal dialog" },
    ],
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCategories = SHORTCUT_CATEGORIES.map((cat) => ({
    ...cat,
    shortcuts: cat.shortcuts.filter(
      (s) =>
        s.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((cat) => cat.shortcuts.length > 0);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div
        className="bg-white border border-zinc-300 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl font-mono text-xs text-left animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-zinc-200 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-black text-white rounded font-mono font-bold text-xs">⌨</span>
            <div>
              <h3 className="font-bold text-sm uppercase text-black font-sans">
                Keyboard Shortcuts Reference
              </h3>
              <p className="text-[10px] text-zinc-400 font-sans">
                Press single keys from anywhere in your workspace.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-black font-bold text-base p-1"
          >
            ✕
          </button>
        </div>

        {/* SEARCH INPUT */}
        <div>
          <input
            type="text"
            placeholder="Search shortcut commands..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-zinc-300 rounded-lg text-xs font-sans focus:outline-none focus:border-black"
            autoFocus
          />
        </div>

        {/* SHORTCUTS LIST */}
        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1">
          {filteredCategories.map((cat) => (
            <div key={cat.category} className="space-y-2">
              <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">
                {cat.category}
              </span>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl divide-y divide-zinc-200/80 overflow-hidden">
                {cat.shortcuts.map((s) => (
                  <div key={s.key} className="p-2.5 flex items-center justify-between gap-3">
                    <span className="font-sans text-xs text-zinc-800">{s.description}</span>
                    <div className="flex gap-1 shrink-0">
                      {s.key.split(" or ").map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 bg-white border border-zinc-300 shadow-xs rounded font-mono text-[10px] font-bold text-black uppercase"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {filteredCategories.length === 0 && (
            <div className="py-8 text-center text-zinc-400 italic font-sans text-xs">
              No matching keyboard shortcut commands found.
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="border-t border-zinc-200 pt-3 flex justify-between items-center text-[10px] text-zinc-400 font-sans">
          <span>Shortcuts are inactive when typing inside input boxes.</span>
          <kbd className="px-2 py-0.5 bg-zinc-100 border border-zinc-300 rounded text-zinc-600 font-mono">
            Esc to Close
          </kbd>
        </div>
      </div>
    </div>
  );
}
