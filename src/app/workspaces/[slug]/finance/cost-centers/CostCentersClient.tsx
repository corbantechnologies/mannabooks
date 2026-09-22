"use client";

import React, { useState, useMemo } from "react";
import {
  createCostCenter,
  updateCostCenter,
  deleteCostCenter,
  type CreateCostCenterInput,
} from "@/lib/actions/cost-centers";

export interface SerializedCostCenter {
  id: string;
  code: string;
  name: string;
  department: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CostCentersClientProps {
  shopSlug: string;
  currency: string;
  initialCenters: SerializedCostCenter[];
}

export function CostCentersClient({
  shopSlug,
  currency,
  initialCenters,
}: CostCentersClientProps) {
  const [centers, setCenters] = useState<SerializedCostCenter[]>(initialCenters);
  const [search, setSearch] = useState("");

  // Modal State
  const [isOpen, setIsOpen] = useState(false);
  const [editingCenter, setEditingCenter] = useState<SerializedCostCenter | null>(null);
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const filteredCenters = useMemo(() => {
    if (!search.trim()) return centers;
    const q = search.toLowerCase().trim();
    return centers.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        (c.department && c.department.toLowerCase().includes(q))
    );
  }, [centers, search]);

  const departments = useMemo(() => {
    const deps = new Set(centers.map((c) => c.department).filter(Boolean));
    return Array.from(deps);
  }, [centers]);

  function openCreateModal() {
    setEditingCenter(null);
    setCode("");
    setName("");
    setDepartment("");
    setError(null);
    setIsOpen(true);
  }

  function openEditModal(c: SerializedCostCenter) {
    setEditingCenter(c);
    setCode(c.code);
    setName(c.name);
    setDepartment(c.department || "");
    setError(null);
    setIsOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      setError("Cost center code and name are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (editingCenter) {
        const res = await updateCostCenter(editingCenter.id, shopSlug, {
          code,
          name,
          department,
        });
        if (!res.success) {
          setError(res.error || "Update failed");
          setIsSubmitting(false);
          return;
        }
        setCenters(
          centers.map((c) =>
            c.id === editingCenter.id
              ? { ...c, code: code.toUpperCase(), name, department: department || null }
              : c
          )
        );
      } else {
        const res = await createCostCenter(shopSlug, {
          code,
          name,
          department,
        });
        if (!res.success) {
          setError(res.error || "Creation failed");
          setIsSubmitting(false);
          return;
        }
        if (res.costCenter) {
          const created: SerializedCostCenter = {
            id: res.costCenter.id,
            code: res.costCenter.code,
            name: res.costCenter.name,
            department: res.costCenter.department,
            isActive: res.costCenter.isActive,
            createdAt: res.costCenter.createdAt.toISOString(),
          };
          setCenters([...centers, created]);
        }
      }
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || "Failed to save cost center");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleToggleActive(c: SerializedCostCenter) {
    try {
      const nextActive = !c.isActive;
      const res = await updateCostCenter(c.id, shopSlug, { isActive: nextActive });
      if (!res.success) {
        alert(res.error || "Failed to toggle status");
        return;
      }
      setCenters(centers.map((item) => (item.id === c.id ? { ...item, isActive: nextActive } : item)));
    } catch (err: any) {
      alert(err.message || "Failed to toggle status");
    }
  }

  async function handleDelete(c: SerializedCostCenter) {
    if (!confirm(`Permanently remove Cost Center ${c.code} (${c.name})?`)) return;
    try {
      const res = await deleteCostCenter(c.id, shopSlug);
      if (!res.success) {
        alert(res.error || "Delete failed");
        return;
      }
      setCenters(centers.filter((item) => item.id !== c.id));
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Active Cost Centers</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {centers.filter((c) => c.isActive).length}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Ready for journal allocation</p>
        </div>

        <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Departments / Divisions</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {departments.length}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Organizational budget buckets</p>
        </div>

        <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Units Defined</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">
            {centers.length}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Including historical projects</p>
        </div>
      </div>

      {/* 2. SEARCH & ACTIONS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Code, Name, or Department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-black"
          />
          <span className="absolute left-3 top-2.5 text-zinc-400 text-xs">🔍</span>
        </div>

        <button
          onClick={openCreateModal}
          className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
        >
          <span>+</span>
          <span>Add Cost Center</span>
        </button>
      </div>

      {/* 3. TABLE */}
      <div className="surface overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-50/70">
              <th className="px-4 py-3 border-r border-zinc-100">Code</th>
              <th className="px-4 py-3 border-r border-zinc-100">Name / Description</th>
              <th className="px-4 py-3 border-r border-zinc-100">Department / Division</th>
              <th className="px-4 py-3 text-center border-r border-zinc-100">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCenters.map((c) => (
              <tr key={c.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                <td className="p-4 border-r border-zinc-100 font-bold text-zinc-900 tracking-wider">
                  {c.code}
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 font-sans text-sm font-semibold text-zinc-900">
                  {c.name}
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 font-sans text-xs text-zinc-600">
                  {c.department || "General Operations"}
                </td>
                <td className="px-4 py-3 border-r border-zinc-100 text-center">
                  <span
                    className={`border px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded ${
                      c.isActive ? "badge-emerald" : "badge-zinc"
                    }`}
                  >
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-sans">
                  <div className="flex items-center justify-end gap-2 text-xs">
                    <button
                      onClick={() => handleToggleActive(c)}
                      className="text-zinc-500 hover:text-black font-medium"
                    >
                      {c.isActive ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => openEditModal(c)}
                      className="text-indigo-600 hover:text-indigo-900 font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(c)}
                      className="text-zinc-400 hover:text-rose-600"
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filteredCenters.length === 0 && (
              <tr>
                <td colSpan={5} className="p-16 text-center">
                  <p className="font-bold text-zinc-800 text-sm font-sans">No Cost Centers Found</p>
                  <p className="text-zinc-400 text-xs font-sans max-w-xs mx-auto mt-1">
                    Define cost centers to track departmental performance, client project profitability, or capital expenditures.
                  </p>
                  <button
                    onClick={openCreateModal}
                    className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider inline-block mt-3"
                  >
                    + Add First Cost Center
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">
                  {editingCenter ? "Edit Cost Center" : "Define New Cost Center"}
                </h3>
                <p className="text-xs text-zinc-500">Segment financial transactions by department or project.</p>
              </div>
              <button onClick={() => setIsOpen(false)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Cost Center Code <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. CC-HQ, PROJ-MOMBASA, MKTG"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 font-mono uppercase rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">
                  Name / Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Headquarters & Corporate Administration"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Department / Division</label>
                <input
                  type="text"
                  placeholder="e.g. Marketing, Legal, Operations, IT"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary-modern px-5 py-2 font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {isSubmitting ? "Saving..." : editingCenter ? "Update Center" : "Save Center"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
