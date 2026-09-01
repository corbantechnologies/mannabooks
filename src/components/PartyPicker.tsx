// src/components/PartyPicker.tsx
"use client";

import { useState, useRef, useEffect, useMemo } from "react";

export interface PartyEntity {
  id: string;
  name: string;
  taxPin?: string | null;
  requiresEtims?: boolean;
  email?: string | null;
  phone?: string | null;
}

interface PartyPickerProps {
  partyType: "CLIENT" | "SUPPLIER";
  parties: PartyEntity[];
  selectedId: string;
  onSelect: (id: string) => void;
  onPartyTypeChange?: (type: "CLIENT" | "SUPPLIER") => void;
}

export function PartyPicker({
  partyType,
  parties,
  selectedId,
  onSelect,
  onPartyTypeChange,
}: PartyPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedParty = useMemo(
    () => parties.find((p) => p.id === selectedId),
    [parties, selectedId]
  );

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const filteredParties = useMemo(() => {
    if (!searchQuery.trim()) return parties;
    const q = searchQuery.toLowerCase().trim();
    return parties.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.taxPin && p.taxPin.toLowerCase().includes(q)) ||
        (p.email && p.email.toLowerCase().includes(q)) ||
        (p.phone && p.phone.toLowerCase().includes(q))
    );
  }, [parties, searchQuery]);

  const placeholder =
    partyType === "CLIENT"
      ? "Walk-in / Over the Counter (No Client Record)"
      : "Select Supplier Profile...";

  return (
    <div className="relative w-full text-left font-sans" ref={popoverRef}>
      
      {/* TRIGGER DISPLAY */}
      {selectedParty ? (
        <div className="flex items-center justify-between gap-2 px-3 py-2 border border-zinc-300 bg-white rounded-md h-10 transition-colors text-xs font-semibold">
          <div
            className="flex-1 min-w-0 cursor-pointer flex items-center gap-2"
            onClick={() => setIsOpen(!isOpen)}
            title={selectedParty.name}
          >
            <span className="truncate text-black font-bold uppercase">{selectedParty.name}</span>
            {selectedParty.taxPin && (
              <span className="bg-black text-white px-1.5 py-0.2 font-mono text-[9px] font-semibold rounded shrink-0">
                PIN: {selectedParty.taxPin}
              </span>
            )}
            {selectedParty.requiresEtims && (
              <span className="border border-amber-300 bg-amber-50 text-amber-900 px-1.5 py-0.2 font-mono text-[9px] font-bold rounded shrink-0">
                eTIMS
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect("");
            }}
            className="text-zinc-400 hover:text-rose-600 font-mono text-xs px-1.5 py-0.5 rounded hover:bg-zinc-100 shrink-0 cursor-pointer transition-colors"
            title="Clear selection"
          >
            ✕
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full px-3 py-2 border rounded-md text-xs font-semibold h-10 flex items-center justify-between gap-2 transition-all cursor-pointer ${
            isOpen
              ? "border-black ring-1 ring-black bg-white"
              : "border-zinc-300 bg-white hover:border-zinc-400 text-zinc-500"
          }`}
        >
          <span className="truncate flex items-center gap-1.5">
            <span className="text-zinc-400 text-[10px]">🔍</span>
            <span className="text-zinc-600 truncate">{placeholder}</span>
          </span>
          <span className="text-[9px] text-zinc-400 font-mono shrink-0">{isOpen ? "▲" : "▼"}</span>
        </button>
      )}

      {/* SEARCHABLE POPOVER DROPDOWN */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-full min-w-[280px] max-w-md border border-zinc-200/80 bg-white rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          
          {/* SEARCH INPUT BAR */}
          <div className="p-2.5 border-b border-zinc-100 bg-zinc-50/70">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-zinc-400 text-xs">
                🔍
              </span>
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${partyType === "CLIENT" ? "clients" : "suppliers"} by name, PIN...`}
                className="w-full pl-8 pr-7 py-2 bg-white border border-zinc-200 rounded-lg text-xs font-medium text-black placeholder:text-zinc-400 focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-400 hover:text-black text-xs font-mono"
                >
                  ✕
                </button>
              )}
            </div>
            <div className="flex justify-between items-center px-1 mt-1.5 text-[10px] font-mono text-zinc-400 uppercase font-semibold">
              <span>{filteredParties.length} entries found</span>
              <span>Click to select</span>
            </div>
          </div>

          {/* LIST ITEMS (SCROLLABLE & CONSTRAINED) */}
          <div className="max-h-56 overflow-y-auto divide-y divide-zinc-100 font-sans text-xs">
            {partyType === "CLIENT" && (
              <div
                onClick={() => {
                  onSelect("");
                  setIsOpen(false);
                }}
                className={`p-3 hover:bg-zinc-50 cursor-pointer transition-colors flex items-center justify-between gap-2 text-zinc-600 ${
                  !selectedId ? "bg-zinc-100 font-bold text-black" : ""
                }`}
              >
                <div>
                  <span className="block font-medium">Walk-in / Over the Counter</span>
                  <span className="text-[10px] text-zinc-400 font-mono">No customer account recorded</span>
                </div>
                {!selectedId && <span className="text-emerald-600 font-bold">✓</span>}
              </div>
            )}

            {filteredParties.map((p) => {
              const isSelected = p.id === selectedId;
              return (
                <div
                  key={p.id}
                  onClick={() => {
                    onSelect(p.id);
                    setIsOpen(false);
                  }}
                  className={`p-3 hover:bg-emerald-50/50 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected ? "bg-emerald-50/80 border-l-2 border-emerald-600" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="font-bold text-black text-xs block truncate uppercase" title={p.name}>
                      {p.name}
                    </span>

                    <div className="flex items-center gap-2 font-mono text-[10px] flex-wrap">
                      {p.taxPin ? (
                        <span className="bg-zinc-100 text-zinc-700 px-1.5 py-0.2 rounded font-semibold">
                          PIN: {p.taxPin}
                        </span>
                      ) : (
                        <span className="text-zinc-400 italic">No PIN</span>
                      )}
                      {p.requiresEtims && (
                        <span className="border border-amber-300 bg-amber-50 text-amber-900 px-1.5 py-0.2 rounded font-bold uppercase text-[9px]">
                          eTIMS
                        </span>
                      )}
                      {p.phone && <span className="text-zinc-500">{p.phone}</span>}
                    </div>
                  </div>

                  {isSelected && (
                    <span className="text-emerald-600 font-bold text-xs shrink-0">✓ Selected</span>
                  )}
                </div>
              );
            })}

            {filteredParties.length === 0 && (
              <div className="p-6 text-center text-zinc-400 space-y-1">
                <p className="font-semibold text-xs">No matching {partyType.toLowerCase()}s found.</p>
              </div>
            )}
          </div>

          {/* POPOVER FOOTER */}
          <div className="p-2 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center text-[10px] font-mono text-zinc-500">
            <span>Press <kbd className="px-1 py-0.5 bg-white border border-zinc-200 rounded text-[9px]">ESC</kbd> to close</span>
          </div>

        </div>
      )}
    </div>
  );
}
