"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { axiosClient } from "@/lib/api/axios";
import { Badge, Button, SkeletonRows } from "@/components/ui";

const ISSUE_LABELS: Record<string, string> = {
  invalid_entries: "Invalid journal entries (wrong workspace account, zero amount, or same account on both sides)",
  documents_not_posted: "Issued invoices, receipts or credit notes missing from the ledger",
  cancelled_or_draft_still_posted: "Draft or cancelled documents still in the ledger",
  payments_not_posted: "Invoice payments missing from the ledger",
  expenses_not_posted: "Expenses missing from the ledger",
  incomes_not_posted: "Other income missing from the ledger",
};

export function LedgerHealthCard({ shopId }: { shopId: string }) {
  const qc = useQueryClient();
  const { data, isLoading, refetch, isFetching } = useQuery<any>({
    queryKey: ["ledger-integrity", shopId],
    queryFn: () => axiosClient.get("/accounts/integrity", { params: { shop_id: shopId } }),
  });
  const repair = useMutation({
    mutationFn: () => axiosClient.post("/accounts/integrity/repair", { shop_id: shopId }),
    onSuccess: (res: any) => {
      const skipped = res?.skipped?.length || 0;
      toast.success(`Posted ${res?.fixed ?? 0} record(s)${skipped ? `, ${skipped} skipped (closed period)` : ""}.`);
      qc.invalidateQueries({ queryKey: ["ledger-integrity", shopId] });
    },
    onError: (err: any) => toast.error(err?.message || "Repair failed."),
  });

  const issues: [string, any][] = Object.entries(data?.issues || {});

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-zinc-900">Ledger health</h2>
          <p className="text-sm text-zinc-600">
            Checks that every invoice, payment, expense and income entry is posted to the general ledger exactly as it should be.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? "Checking…" : "Run check"}
          </Button>
          {issues.length > 0 && data?.glEnabled && (
            <Button onClick={() => repair.mutate()} disabled={repair.isPending}>
              {repair.isPending ? "Repairing…" : "Repair"}
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <SkeletonRows rows={2} />
      ) : !data ? null : !data.glEnabled ? (
        <p className="text-sm text-zinc-600">The general ledger is not enabled for this workspace.</p>
      ) : issues.length === 0 ? (
        <div className="flex items-center gap-2 text-sm">
          <Badge tone="success">Healthy</Badge>
          <span className="text-zinc-600">{data.entryCount} journal entries; everything is in step.</span>
        </div>
      ) : (
        <ul className="space-y-2">
          {issues.map(([key, value]) => (
            <li key={key} className="flex items-start justify-between gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <span className="text-amber-900">{ISSUE_LABELS[key] || key}</span>
              <Badge tone="warning">{value.count}</Badge>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
