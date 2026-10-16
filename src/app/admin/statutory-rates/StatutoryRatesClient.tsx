"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { axiosClient } from "@/lib/api/axios";
import { Spinner } from "@/components/Spinner";

interface RateSet {
  id: string;
  name: string;
  effectiveFrom: string;
  rates: any;
  isVerified: boolean;
  notes: string | null;
  inUse: boolean;
}

// Flat editable view of the rates JSON (see mannabooksapi app/modules/payroll/rates.py).
interface RateForm {
  name: string;
  effectiveFrom: string;
  notes: string;
  isVerified: boolean;
  nssfRate: string;
  nssfLower: string;
  nssfUpper: string;
  shifRate: string;
  shifMinimum: string;
  ahlEmployee: string;
  ahlEmployer: string;
  nita: string;
  personalRelief: string;
  bands: string; // one band per line: "width rate", last line "* rate"
}

function toForm(rs?: RateSet): RateForm {
  const r = rs?.rates || {};
  return {
    name: rs?.name || "",
    effectiveFrom: rs?.effectiveFrom || "",
    notes: rs?.notes || "",
    isVerified: rs?.isVerified ?? false,
    nssfRate: r.nssf?.rate ?? "0.06",
    nssfLower: r.nssf?.lower_limit ?? "",
    nssfUpper: r.nssf?.upper_limit ?? "",
    shifRate: r.shif?.rate ?? "0.0275",
    shifMinimum: r.shif?.minimum ?? "300",
    ahlEmployee: r.housing_levy?.employee_rate ?? "0.015",
    ahlEmployer: r.housing_levy?.employer_rate ?? "0.015",
    nita: r.nita?.employer_per_employee ?? "50",
    personalRelief: r.paye?.personal_relief ?? "2400",
    bands: (r.paye?.bands || [["24000", "0.10"], ["8333", "0.25"], ["467667", "0.30"], ["300000", "0.325"], [null, "0.35"]])
      .map(([w, rate]: [string | null, string]) => `${w ?? "*"} ${rate}`)
      .join("\n"),
  };
}

function toRates(f: RateForm) {
  const bands = f.bands
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const [w, rate] = l.split(/\s+/);
      return [w === "*" ? null : w, rate];
    });
  return {
    nssf: { rate: f.nssfRate, lower_limit: f.nssfLower, upper_limit: f.nssfUpper, employer_match: true },
    shif: { rate: f.shifRate, minimum: f.shifMinimum },
    housing_levy: { employee_rate: f.ahlEmployee, employer_rate: f.ahlEmployer },
    nita: { employer_per_employee: f.nita },
    paye: { bands, personal_relief: f.personalRelief, deduct_nssf: true, deduct_shif: true, deduct_housing_levy: true },
  };
}

const FIELDS: [keyof RateForm, string][] = [
  ["nssfRate", "NSSF rate (each side)"],
  ["nssfLower", "NSSF lower earnings limit"],
  ["nssfUpper", "NSSF upper earnings limit"],
  ["shifRate", "SHIF rate"],
  ["shifMinimum", "SHIF minimum (KES)"],
  ["ahlEmployee", "Housing Levy – employee rate"],
  ["ahlEmployer", "Housing Levy – employer rate"],
  ["nita", "NITA per employee (KES)"],
  ["personalRelief", "Monthly personal relief (KES)"],
];

export function StatutoryRatesClient() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<RateSet | "new" | null>(null);
  const [form, setForm] = useState<RateForm>(toForm());

  const { data, isLoading } = useQuery<any>({
    queryKey: ["admin-statutory-rates"],
    queryFn: () => axiosClient.get("/admin/statutory-rates"),
  });
  const rateSets: RateSet[] = data?.rateSets || [];

  const save = useMutation({
    mutationFn: async () => {
      if (editing === "new") {
        return axiosClient.post("/admin/statutory-rates", {
          name: form.name,
          effective_from: form.effectiveFrom,
          rates: toRates(form),
          is_verified: form.isVerified,
          notes: form.notes || null,
        });
      }
      const current = editing as RateSet;
      return axiosClient.patch(`/admin/statutory-rates/${current.id}`, {
        name: form.name,
        is_verified: form.isVerified,
        notes: form.notes || null,
        ...(current.inUse ? {} : { rates: toRates(form) }),
      });
    },
    onSuccess: () => {
      toast.success("Rate set saved.");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-statutory-rates"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to save rate set."),
  });

  const remove = useMutation({
    mutationFn: (id: string) => axiosClient.delete(`/admin/statutory-rates/${id}`),
    onSuccess: () => {
      toast.success("Rate set deleted.");
      qc.invalidateQueries({ queryKey: ["admin-statutory-rates"] });
    },
    onError: (err: any) => toast.error(err?.message || "Failed to delete rate set."),
  });

  const ratesLocked = editing !== "new" && editing !== null && editing.inUse;

  return (
    <div className="space-y-6 font-mono text-xs">
      <div className="flex flex-col sm:flex-row justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold uppercase font-sans">Statutory Payroll Rates</h1>
          <p className="font-sans text-xs text-zinc-600 max-w-2xl">
            Each payroll month uses the newest rate set whose effective date is on or before the 1st of that month.
            Rates already used in payroll runs can&apos;t be edited; add a new set with a later effective date instead.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing("new");
            setForm({ ...toForm(rateSets[0]), name: "", effectiveFrom: "", notes: "", isVerified: false });
          }}
          className="btn-primary-modern px-4 py-2 text-xs uppercase self-start"
        >
          + New rate set
        </button>
      </div>

      {editing && (
        <div className="card-modern p-5 bg-white space-y-4">
          <h2 className="text-sm font-semibold uppercase font-sans">{editing === "new" ? "New rate set" : `Edit: ${editing.name}`}</h2>
          {ratesLocked && (
            <p className="font-sans text-[11px] text-amber-700">These rates are used by payroll runs; only the name, notes and verified flag can change.</p>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-500">Name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-2 py-1.5 border border-zinc-300 rounded" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-500">Effective from</span>
              <input
                type="date"
                disabled={editing !== "new"}
                value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })}
                className="w-full px-2 py-1.5 border border-zinc-300 rounded disabled:bg-zinc-100"
              />
            </label>
            <label className="flex items-center gap-2 mt-5">
              <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm({ ...form, isVerified: e.target.checked })} />
              <span className="font-sans">Verified against official publications</span>
            </label>
            {FIELDS.map(([key, label]) => (
              <label key={key} className="space-y-1">
                <span className="text-[10px] uppercase text-zinc-500">{label}</span>
                <input
                  disabled={ratesLocked}
                  value={form[key] as string}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-2 py-1.5 border border-zinc-300 rounded disabled:bg-zinc-100"
                />
              </label>
            ))}
            <label className="space-y-1 md:col-span-2">
              <span className="text-[10px] uppercase text-zinc-500">PAYE monthly bands (width rate per line; last line &quot;* rate&quot;)</span>
              <textarea
                disabled={ratesLocked}
                rows={5}
                value={form.bands}
                onChange={(e) => setForm({ ...form, bands: e.target.value })}
                className="w-full px-2 py-1.5 border border-zinc-300 rounded disabled:bg-zinc-100"
              />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] uppercase text-zinc-500">Notes / source</span>
              <textarea rows={5} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-2 py-1.5 border border-zinc-300 rounded" />
            </label>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setEditing(null)} className="btn-secondary-modern px-4 py-2 text-xs uppercase">Cancel</button>
            <button type="button" disabled={save.isPending} onClick={() => save.mutate()} className="btn-primary-modern px-4 py-2 text-xs uppercase">
              {save.isPending ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      )}

      <div className="card-modern overflow-x-auto bg-white">
        {isLoading ? (
          <div className="p-8 flex justify-center"><Spinner size={20} /></div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 text-[10px] uppercase font-semibold text-zinc-400 bg-zinc-50/60">
                <th className="px-3 py-3">Effective from</th>
                <th className="px-3 py-3">Name</th>
                <th className="px-3 py-3">NSSF limits</th>
                <th className="px-3 py-3">Status</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {rateSets.map((rs) => (
                <tr key={rs.id} className="border-b border-zinc-100/80 last:border-0">
                  <td className="px-3 py-3">{rs.effectiveFrom}</td>
                  <td className="px-3 py-3">
                    {rs.name}
                    {rs.notes && <span className="block text-[10px] text-zinc-400 font-sans max-w-md">{rs.notes}</span>}
                  </td>
                  <td className="px-3 py-3">
                    {rs.rates?.nssf?.lower_limit} / {rs.rates?.nssf?.upper_limit}
                  </td>
                  <td className="px-3 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] uppercase ${rs.isVerified ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {rs.isVerified ? "Verified" : "Unverified"}
                    </span>
                    {rs.inUse && <span className="ml-2 text-[10px] text-zinc-400">in use</span>}
                  </td>
                  <td className="px-3 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(rs);
                        setForm(toForm(rs));
                      }}
                      className="underline text-[10px] uppercase mr-3"
                    >
                      Edit
                    </button>
                    {!rs.inUse && (
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete "${rs.name}"?`)) remove.mutate(rs.id);
                        }}
                        className="underline text-[10px] uppercase text-rose-600"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
