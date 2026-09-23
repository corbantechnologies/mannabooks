"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEmployee } from "@/lib/actions/payroll";
import { Spinner } from "@/components/Spinner";
import { toast } from "react-hot-toast";

interface EditEmployeeModalProps {
  employee: {
    id: string;
    fullName: string;
    email: string | null;
    nationalId: string | null;
    kraPin: string | null;
    baseSalary: string;
    commissionRate: string;
    department?: string | null;
    designation?: string | null;
    employmentType?: string | null;
    bankName?: string | null;
    bankAccountNumber?: string | null;
    bankBranch?: string | null;
    mpesaPhone?: string | null;
    isActive: boolean;
  };
  shopId: string;
  shopSlug: string;
}

export function EditEmployeeModal({ employee, shopId, shopSlug }: EditEmployeeModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [fullName, setFullName] = useState(employee.fullName);
  const [email, setEmail] = useState(employee.email || "");
  const [department, setDepartment] = useState(employee.department || "");
  const [designation, setDesignation] = useState(employee.designation || "");
  const [employmentType, setEmploymentType] = useState<"FULL_TIME" | "PART_TIME" | "CONTRACT" | "INTERN">(
    (employee.employmentType as any) || "FULL_TIME"
  );
  const [nationalId, setNationalId] = useState(employee.nationalId || "");
  const [kraPin, setKraPin] = useState(employee.kraPin || "");
  const [baseSalary, setBaseSalary] = useState(employee.baseSalary);
  const [commissionRate, setCommissionRate] = useState(employee.commissionRate);
  const [bankName, setBankName] = useState(employee.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(employee.bankAccountNumber || "");
  const [bankBranch, setBankBranch] = useState(employee.bankBranch || "");
  const [mpesaPhone, setMpesaPhone] = useState(employee.mpesaPhone || "");
  const [isActive, setIsActive] = useState(employee.isActive);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError("Employee name is required.");
      return;
    }

    setLoading(true);

    const res = await updateEmployee({
      id: employee.id,
      shopId,
      fullName: fullName.trim(),
      email: email.trim() || undefined,
      department: department.trim() || undefined,
      designation: designation.trim() || undefined,
      employmentType,
      nationalId: nationalId.trim() || undefined,
      kraPin: kraPin.trim().toUpperCase() || undefined,
      baseSalary: parseFloat(baseSalary) || 0,
      commissionRate: parseFloat(commissionRate) || 0,
      bankName: bankName.trim() || undefined,
      bankAccountNumber: bankAccountNumber.trim() || undefined,
      bankBranch: bankBranch.trim() || undefined,
      mpesaPhone: mpesaPhone.trim() || undefined,
      isActive,
    });

    setLoading(false);

    if (res.success) {
      setIsOpen(false);
      toast.success("Employee profile updated.");
      router.refresh();
    } else {
      setError(res.error || "Failed to update employee.");
    }
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-secondary-modern px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider"
      >
        Edit Profile
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-200/80 rounded-xl shadow-2xl w-[95%] sm:w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-6 font-mono text-xs animate-in zoom-in-95 duration-150 text-left">
            
            <div className="flex justify-between items-start border-b border-zinc-100 pb-4">
              <div>
                <h3 className="font-semibold uppercase tracking-tight text-base font-sans text-black">Edit Employee Profile</h3>
                <p className="font-sans text-xs text-zinc-400 mt-0.5">Update employee details, contracts, and banking info</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-zinc-500 font-semibold hover:bg-zinc-100 px-2 py-0.5 border border-zinc-300 rounded text-xs"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="border border-rose-200 bg-rose-50 p-3 text-rose-700 font-semibold rounded text-xs">
                ⚠ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
              {/* PRIMARY DETAILS */}
              <div className="space-y-3">
                <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
                  1. Staff Identity &amp; Role
                </p>

                <div className="space-y-1">
                  <label className="text-black font-semibold uppercase block">Staff Member Full Name *</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. John Kiprono"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs font-semibold text-black"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Staff Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. john@company.com"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Sales"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Designation</label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Lead Rep"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Contract</label>
                    <select
                      value={employmentType}
                      onChange={(e) => setEmploymentType(e.target.value as any)}
                      className="w-full px-2 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                    >
                      <option value="FULL_TIME">Full Time</option>
                      <option value="PART_TIME">Part Time</option>
                      <option value="CONTRACT">Contract</option>
                      <option value="INTERN">Intern</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">National ID / Passport #</label>
                    <input
                      type="text"
                      value={nationalId}
                      onChange={(e) => setNationalId(e.target.value)}
                      placeholder="e.g. 12345678"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">KRA Personal Tax PIN</label>
                    <input
                      type="text"
                      value={kraPin}
                      onChange={(e) => setKraPin(e.target.value)}
                      placeholder="e.g. A012345678B"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 uppercase rounded text-xs font-semibold font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* COMPENSATION */}
              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
                  2. Compensation Terms
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Base Monthly Salary (KES)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={baseSalary}
                      onChange={(e) => setBaseSalary(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black font-semibold rounded text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Commissions Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={commissionRate}
                      onChange={(e) => setCommissionRate(e.target.value)}
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black rounded text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* BANKING & DISBURSEMENT */}
              <div className="space-y-3 pt-2">
                <p className="text-[11px] font-sans font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 pb-1">
                  3. Payout &amp; Banking Details
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Bank Name</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="e.g. Equity Bank"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Account Number</label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="e.g. 0123456789"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-zinc-400 uppercase block text-[10px] font-semibold">Branch</label>
                    <input
                      type="text"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder="e.g. Westlands"
                      className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-zinc-400 uppercase block text-[10px] font-semibold">M-PESA Registered Phone</label>
                  <input
                    type="text"
                    value={mpesaPhone}
                    onChange={(e) => setMpesaPhone(e.target.value)}
                    placeholder="e.g. +254712345678"
                    className="w-full px-3 py-2 border border-zinc-300 bg-white focus:outline-none focus:border-black placeholder:text-zinc-300 rounded text-xs"
                  />
                </div>
              </div>

              {/* STATUS */}
              <div className="flex items-center gap-2 p-3 bg-zinc-50 border border-zinc-200 rounded">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="accent-black w-4 h-4 cursor-pointer rounded-sm"
                />
                <label htmlFor="editIsActive" className="font-semibold uppercase text-[10px] cursor-pointer">
                  Employee is Active / Logged in Contract
                </label>
              </div>

              <div className="border-t border-zinc-200/80 pt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary-modern px-3 py-1.5 text-xs font-semibold uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-modern px-4 py-1.5 text-xs font-semibold uppercase disabled:bg-zinc-300 flex items-center justify-center gap-1.5"
                >
                  {loading ? (
                    <>
                      <Spinner size={10} color="white" />
                      <span>SAVING...</span>
                    </>
                  ) : (
                    "SAVE CHANGES"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
