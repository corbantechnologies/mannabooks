"use client";
// Shared screen for Expenses and Other Income (one implementation, two configurations).

import { useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { ConfirmModal } from "@/components/ConfirmModal";
import {
  Badge,
  Button,
  Column,
  DataTable,
  EmptyState,
  FormField,
  PageHeader,
  Sheet,
  SkeletonRows,
  StatCard,
  inputClass,
} from "@/components/ui";
import {
  CashbookEntry,
  CashbookInput,
  CashbookKind,
  useCashbook,
  useDeleteCashbookEntry,
  useSaveCashbookEntry,
} from "@/hooks/useCashbook";
import { formatCurrency } from "@/lib/utils";

const CATEGORIES: Record<CashbookKind, [string, string][]> = {
  expense: [
    ["RENT", "Rent & lease"],
    ["UTILITIES", "Utilities"],
    ["FUEL", "Fuel & travel"],
    ["MARKETING", "Marketing"],
    ["SALARIES", "Salaries & wages"],
    ["OFFICE_SUPPLIES", "Office supplies"],
    ["OTHER", "Other"],
  ],
  income: [
    ["INTEREST", "Interest"],
    ["DIVIDENDS", "Dividends"],
    ["ASSET_SALE", "Asset sale"],
    ["REFUNDS", "Refunds"],
    ["COMMISSION", "Commission"],
    ["RENTAL_INCOME", "Rental income"],
    ["GRANTS_SUBSIDIES", "Grants & subsidies"],
    ["OTHER", "Other"],
  ],
};

const CHANNELS: [string, string][] = [
  ["MPESA", "M-Pesa"],
  ["CASH", "Cash"],
  ["BANK", "Bank transfer"],
  ["CARD", "Card"],
  ["CHEQUE", "Cheque"],
  ["OTHER", "Other"],
];

const COPY: Record<CashbookKind, { title: string; eyebrow: string; description: string; add: string; noun: string; uploadCategory: string }> = {
  expense: {
    title: "Expenses",
    eyebrow: "Money out",
    description: "Running costs that aren't supplier bills: rent, utilities, fuel and similar.",
    add: "Add expense",
    noun: "expense",
    uploadCategory: "expenses",
  },
  income: {
    title: "Other income",
    eyebrow: "Money in",
    description: "Income that isn't from sales: interest, rent received, refunds, grants.",
    add: "Add income",
    noun: "income",
    uploadCategory: "incomes",
  },
};

type Range = "month" | "last_month" | "year" | "all" | "custom";

function isoDate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function rangeDates(range: Range): { from?: string; to?: string } {
  const now = new Date();
  if (range === "month") return { from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)) };
  if (range === "last_month")
    return {
      from: isoDate(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
      to: isoDate(new Date(now.getFullYear(), now.getMonth(), 0)),
    };
  if (range === "year") return { from: isoDate(new Date(now.getFullYear(), 0, 1)) };
  return {};
}

const emptyForm = (): CashbookInput & { errors: Record<string, string> } => ({
  description: "",
  amount: "",
  category: "OTHER",
  date: isoDate(new Date()),
  paymentChannel: "",
  paymentReference: "",
  attachmentUrl: null,
  isNonDeductible: false,
  errors: {},
});

export function CashbookClient({
  kind,
  shopId,
  shopSlug,
  currency,
}: {
  kind: CashbookKind;
  shopId: string;
  shopSlug: string;
  currency: string;
}) {
  const copy = COPY[kind];
  const categoryLabel = useMemo(() => Object.fromEntries(CATEGORIES[kind]), [kind]);
  const channelLabel = useMemo(() => Object.fromEntries(CHANNELS), []);

  // Filters
  const [range, setRange] = useState<Range>("month");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(50);
  useEffect(() => {
    const t = setTimeout(() => setQ(search.trim()), 300);
    return () => clearTimeout(t);
  }, [search]);
  const dates = range === "custom" ? { from: custom.from || undefined, to: custom.to || undefined } : rangeDates(range);

  const { data, isLoading, isFetching, error } = useCashbook(kind, shopId, {
    dateFrom: dates.from,
    dateTo: dates.to,
    category,
    q,
    limit,
  });
  const save = useSaveCashbookEntry(kind, shopId);
  const remove = useDeleteCashbookEntry(kind, shopId);

  // Form sheet
  const [editing, setEditing] = useState<CashbookEntry | "new" | null>(null);
  const [form, setForm] = useState(emptyForm());
  const [uploading, setUploading] = useState(false);
  const [toDelete, setToDelete] = useState<CashbookEntry | null>(null);

  const openNew = () => {
    setForm(emptyForm());
    setEditing("new");
  };
  const openEdit = (e: CashbookEntry) => {
    setForm({
      description: e.description,
      amount: String(Number(e.amount)),
      category: e.category,
      date: (e.date || "").slice(0, 10),
      paymentChannel: e.paymentChannel || "",
      paymentReference: e.paymentReference || "",
      attachmentUrl: e.attachmentUrl || null,
      isNonDeductible: Boolean(e.isNonDeductible),
      errors: {},
    });
    setEditing(e);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (form.description.trim().length < 2) errors.description = "Describe what this was for.";
    const amount = Number(form.amount);
    if (!form.amount || !Number.isFinite(amount) || amount <= 0) errors.amount = "Enter an amount greater than zero.";
    if (!form.date) errors.date = "Pick a date.";
    setForm((f) => ({ ...f, errors }));
    return Object.keys(errors).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      await save.mutateAsync({ id: editing && editing !== "new" ? editing.id : undefined, input: form });
      toast.success(editing === "new" ? `${copy.noun[0].toUpperCase()}${copy.noun.slice(1)} saved` : "Changes saved");
      setEditing(null);
    } catch (err: any) {
      toast.error(err?.message || "Could not save. Please try again.");
    }
  };

  const upload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("shopSlug", shopSlug);
      fd.append("category", copy.uploadCategory);
      const res = await fetch("/api/upload/minio", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok || !json.url) throw new Error(json.error || "Upload failed");
      setForm((f) => ({ ...f, attachmentUrl: json.url }));
      toast.success("Attachment uploaded");
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const items = data?.items || [];
  const total = Number(data?.summary.totalAmount || 0);
  const top = data?.summary.byCategory[0];
  const money = (v: string | number) => formatCurrency(Number(v), currency);

  const columns: Column<CashbookEntry>[] = [
    {
      key: "description",
      header: "Description",
      primary: true,
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-zinc-900">{e.description}</p>
          {e.paymentReference && <p className="truncate text-xs text-zinc-500 font-mono">{e.paymentReference}</p>}
        </div>
      ),
    },
    { key: "date", header: "Date", render: (e) => new Date(e.date).toLocaleDateString("en-KE", { dateStyle: "medium" }) },
    {
      key: "category",
      header: "Category",
      render: (e) => (
        <span className="inline-flex flex-wrap gap-1">
          <Badge>{categoryLabel[e.category] || e.category}</Badge>
          {e.isNonDeductible && <Badge tone="warning">Non-deductible</Badge>}
        </span>
      ),
    },
    { key: "channel", header: "Paid via", desktopOnly: true, render: (e) => (e.paymentChannel ? channelLabel[e.paymentChannel] || e.paymentChannel : "—") },
    {
      key: "attachment",
      header: "Attachment",
      desktopOnly: true,
      render: (e) =>
        e.attachmentUrl ? (
          <a href={e.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline underline-offset-2">
            View
          </a>
        ) : (
          "—"
        ),
    },
    { key: "amount", header: "Amount", align: "right", render: (e) => <span className="font-medium">{money(e.amount)}</span> },
  ];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
        actions={<Button onClick={openNew}>+ {copy.add}</Button>}
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Total for this view" value={money(total)} tone={kind === "expense" ? "negative" : "positive"} />
        <StatCard label="Entries" value={data?.summary.count ?? "—"} />
        <StatCard label="Largest category" value={top ? categoryLabel[top.category] || top.category : "—"} hint={top ? money(top.amount) : undefined} />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="flex gap-1 overflow-x-auto" role="group" aria-label="Date range">
          {([
            ["month", "This month"],
            ["last_month", "Last month"],
            ["year", "This year"],
            ["all", "All"],
            ["custom", "Custom"],
          ] as [Range, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setRange(value);
                setLimit(50);
              }}
              aria-pressed={range === value}
              className={`min-h-10 shrink-0 rounded-lg px-3 text-sm ${range === value ? "bg-zinc-900 text-white" : "text-zinc-700 hover:bg-zinc-100"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {range === "custom" && (
          <div className="flex gap-2">
            <input type="date" aria-label="From" value={custom.from} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className={inputClass} />
            <input type="date" aria-label="To" value={custom.to} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className={inputClass} />
          </div>
        )}
        <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputClass} sm:w-48`}>
          <option value="">All categories</option>
          {CATEGORIES[kind].map(([v, l]) => (
            <option key={v} value={v}>{l}</option>
          ))}
        </select>
        <input
          type="search"
          aria-label="Search"
          placeholder="Search description or reference"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} sm:flex-1 sm:min-w-56`}
        />
      </div>

      {/* List */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {isLoading ? (
          <SkeletonRows />
        ) : error ? (
          <EmptyState title="Couldn't load entries" description={(error as Error).message} />
        ) : items.length === 0 ? (
          <EmptyState
            title={`No ${copy.noun} entries in this view`}
            description="Change the filters or add your first entry."
            action={<Button onClick={openNew}>+ {copy.add}</Button>}
          />
        ) : (
          <DataTable
            columns={columns}
            rows={items}
            rowKey={(e) => e.id}
            actions={(e) => (
              <>
                <Button variant="ghost" className="px-3" onClick={() => openEdit(e)} aria-label={`Edit ${e.description}`}>
                  Edit
                </Button>
                <Button variant="ghost" className="px-3 text-rose-700" onClick={() => setToDelete(e)} aria-label={`Delete ${e.description}`}>
                  Delete
                </Button>
              </>
            )}
            footer={
              data && data.total > items.length ? (
                <div className="border-t border-zinc-100 p-3 text-center">
                  <Button variant="secondary" disabled={isFetching} onClick={() => setLimit((l) => Math.min(l + 50, 200))}>
                    {isFetching ? "Loading…" : `Show more (${items.length} of ${data.total})`}
                  </Button>
                  {limit >= 200 && <p className="mt-2 text-xs text-zinc-500">Narrow the date range to see older entries.</p>}
                </div>
              ) : null
            }
          />
        )}
      </div>

      {/* Create / edit */}
      <Sheet
        open={editing !== null}
        onClose={() => setEditing(null)}
        title={editing === "new" ? copy.add : `Edit ${copy.noun}`}
        footer={
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={submit} disabled={save.isPending || uploading}>
              {save.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        }
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
        >
          <FormField label="Description" required htmlFor="cb-desc" error={form.errors.description}>
            <input id="cb-desc" className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={`Amount (${currency})`} required htmlFor="cb-amount" error={form.errors.amount}>
              <input
                id="cb-amount"
                inputMode="decimal"
                className={`${inputClass} tabular-nums`}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value.replace(/[^\d.]/g, "") })}
              />
            </FormField>
            <FormField label="Date" required htmlFor="cb-date" error={form.errors.date}>
              <input id="cb-date" type="date" className={inputClass} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </FormField>
          </div>
          <FormField label="Category" htmlFor="cb-cat">
            <select id="cb-cat" className={inputClass} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {CATEGORIES[kind].map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label={kind === "expense" ? "Paid via" : "Received via"} htmlFor="cb-channel">
              <select id="cb-channel" className={inputClass} value={form.paymentChannel} onChange={(e) => setForm({ ...form, paymentChannel: e.target.value })}>
                <option value="">Not specified</option>
                {CHANNELS.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Reference" htmlFor="cb-ref" hint="e.g. M-Pesa code">
              <input id="cb-ref" className={inputClass} value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} />
            </FormField>
          </div>
          {kind === "expense" && (
            <label className="flex min-h-11 items-start gap-3 rounded-lg border border-zinc-200 p-3 text-sm">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-zinc-900"
                checked={Boolean(form.isNonDeductible)}
                onChange={(e) => setForm({ ...form, isNonDeductible: e.target.checked })}
              />
              <span>
                <span className="font-medium text-zinc-900">Not tax-deductible</span>
                <span className="block text-xs text-zinc-500">Excluded from allowable expenses in the tax computation.</span>
              </span>
            </label>
          )}
          <FormField label={kind === "expense" ? "Receipt" : "Attachment"} hint="PDF, JPG, PNG or WEBP, up to 10MB">
            {form.attachmentUrl ? (
              <div className="flex items-center justify-between gap-2 rounded-lg border border-zinc-200 p-3 text-sm">
                <a href={form.attachmentUrl} target="_blank" rel="noopener noreferrer" className="truncate underline underline-offset-2">
                  View attachment
                </a>
                <Button variant="ghost" onClick={() => setForm({ ...form, attachmentUrl: null })}>Remove</Button>
              </div>
            ) : (
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp"
                capture="environment"
                disabled={uploading}
                onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
                className="block w-full text-sm file:mr-3 file:min-h-11 file:rounded-lg file:border-0 file:bg-zinc-100 file:px-4 file:text-sm file:font-medium"
              />
            )}
            {uploading && <p className="text-xs text-zinc-500">Uploading…</p>}
          </FormField>
          <button type="submit" className="hidden" aria-hidden="true" tabIndex={-1} />
        </form>
      </Sheet>

      <ConfirmModal
        isOpen={toDelete !== null}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          try {
            await remove.mutateAsync(toDelete.id);
            toast.success("Deleted");
          } catch (err: any) {
            toast.error(err?.message || "Could not delete.");
          } finally {
            setToDelete(null);
          }
        }}
        title={`Delete this ${copy.noun}?`}
        message={toDelete ? `"${toDelete.description}" (${money(toDelete.amount)}) will be removed, along with its ledger entry. This is recorded in the audit log.` : ""}
        confirmLabel="Delete"
        isLoading={remove.isPending}
      />
    </div>
  );
}
