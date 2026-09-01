// src/app/workspaces/[slug]/employees/EmployeeRowPopover.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { DeleteEmployeeButton } from "./DeleteEmployeeButton";
import { toast } from "react-hot-toast";

interface EmployeeRowPopoverProps {
  employee: {
    id: string;
    fullName: string;
    nationalId: string | null;
    kraPin: string | null;
    isActive: boolean;
  };
  shopId: string;
  shopSlug: string;
}

export function EmployeeRowPopover({ employee, shopId, shopSlug }: EmployeeRowPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

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

  function copyText(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
    setIsOpen(false);
  }

  return (
    <div className="relative inline-block text-left" ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        className={`w-8 h-8 flex items-center justify-center rounded-md font-mono text-xs font-bold transition-all cursor-pointer ${
          isOpen
            ? "bg-black text-white"
            : "border border-zinc-200 hover:border-zinc-400 bg-white text-zinc-700 hover:text-black"
        }`}
        title="Employee Actions"
      >
        •••
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-52 border border-zinc-200/80 bg-white rounded-xl shadow-xl z-50 font-mono text-xs divide-y divide-zinc-100 animate-in fade-in zoom-in-95 duration-100 origin-top-right overflow-hidden text-left">
          <div className="py-1">
            <Link
              href={`/workspaces/${shopSlug}/payroll/employees/${employee.id}`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2"
            >
              <span>👤</span>
              <span>View Profile &amp; History</span>
            </Link>

            <Link
              href={`/workspaces/${shopSlug}/payroll/new`}
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-800 hover:text-black transition-colors flex items-center gap-2"
            >
              <span>💵</span>
              <span>Process Payroll Run</span>
            </Link>
          </div>

          <div className="py-1">
            {employee.kraPin && (
              <button
                type="button"
                onClick={() => copyText(employee.kraPin!, "KRA PIN")}
                className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-600 hover:text-black transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>📌</span>
                  <span>PIN</span>
                </span>
                <span className="font-bold text-[10px] text-zinc-400">{employee.kraPin}</span>
              </button>
            )}

            {employee.nationalId && (
              <button
                type="button"
                onClick={() => copyText(employee.nationalId!, "National ID")}
                className="w-full text-left px-3.5 py-2 hover:bg-zinc-100 font-medium text-xs text-zinc-600 hover:text-black transition-colors flex items-center justify-between cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>🪪</span>
                  <span>National ID</span>
                </span>
                <span className="font-bold text-[10px] text-zinc-400">{employee.nationalId}</span>
              </button>
            )}
          </div>

          <div className="py-1">
            <DeleteEmployeeButton
              employeeId={employee.id}
              fullName={employee.fullName}
              shopId={shopId}
              shopSlug={shopSlug}
              customTrigger={(openModal) => (
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    openModal();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-medium text-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span>🗑️</span>
                  <span>Remove Employee</span>
                </button>
              )}
            />
          </div>
        </div>
      )}
    </div>
  );
}
