import { db } from "@/db";
import { clients, documents, shops, suppliers } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ClientActionsPopover } from "./ClientActionsPopover";
import { ClientDocumentsSubLedger } from "./ClientDocumentsSubLedger";
import { getLoyaltyProgram, getClientLoyaltyAccount } from "@/lib/actions/loyalty";
import Link from "next/link";

interface ClientProfilePageProps {
  params: Promise<{ slug: string; id: string }>;
}

export default async function ClientProfileLedgerPage({ params }: ClientProfilePageProps) {
  // 1. Await params
  const { slug, id } = await params;

  // 2. Resolve multi-tenant shop criteria context
  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  const loyaltyProgramRes = await getLoyaltyProgram(shop.id);
  const loyaltyProgram = loyaltyProgramRes.success ? loyaltyProgramRes.data : null;
  const clientLoyaltyRes = await getClientLoyaltyAccount(shop.id, id);
  const loyaltyAccount = clientLoyaltyRes.success ? clientLoyaltyRes.data : null;

  // 3. Fetch the targeted client profile alongside all their historical document records
  const clientRecord = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, id),
      eq(clients.shopId, shop.id)
    ),
    with: {
      documents: {
        orderBy: [desc(documents.issueDate)],
      },
    },
  });

  if (!clientRecord) {
    notFound();
  }

  // 3.5 Check if a corresponding supplier profile already exists
  const matchedSupplier = await db.query.suppliers.findFirst({
    where: and(
      eq(suppliers.shopId, shop.id),
      clientRecord.taxPin
        ? or(eq(suppliers.taxPin, clientRecord.taxPin), eq(suppliers.email, clientRecord.email))
        : eq(suppliers.email, clientRecord.email)
    ),
  });

  // 3. Compute structural customer performance aggregations with absolute precision.
  //
  // Revenue model: every cash collection flows through a RECEIPT document.
  // When an invoice is converted to a receipt, the invoice becomes PAID and a
  // child RECEIPT is created with parentDocumentId pointing to the invoice.
  // Counting both would double the LTV — so we ONLY count RECEIPTs for settled
  // revenue and only count UNPAID invoices for outstanding A/R.
  const performanceMetrics = clientRecord.documents.reduce(
    (acc, doc) => {
      const value = parseFloat(doc.grandTotal);
      if (doc.type === "RECEIPT") {
        // All cash received — standalone receipts AND invoice-derived receipts.
        acc.lifetimeValue += value;
      } else if (doc.type === "INVOICE") {
        // PAID invoices: do NOT add to LTV — the receipt already captured that cash.
        if (doc.status === "ISSUED" || doc.status === "PARTIALLY_PAID") {
          acc.outstandingLiability += value;
        } else if (doc.status === "OVERDUE") {
          acc.outstandingLiability += value;
          acc.overdueLiability += value;
        }
      } else if (doc.type === "CREDIT_NOTE" && doc.status === "PAID") {
        // Deduct credit notes from lifetime value (refunds reduce earned revenue).
        acc.lifetimeValue -= value;
      }
      return acc;
    },
    { lifetimeValue: 0, outstandingLiability: 0, overdueLiability: 0 }
  );

  return (
    <div className="p-5 sm:p-7 space-y-6">
      
      {/* BACK NAVIGATION AND INTERFACE HEADER */}
      <div className="space-y-3">
        <Link 
          href={`/workspaces/${slug}/clients`} 
          className="font-sans text-xs font-bold text-zinc-400 hover:underline inline-flex items-center gap-1"
        >
          ← Back to Client Directory
        </Link>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-400 font-medium">Customer Statement</span>
              {clientRecord.requiresEtims && (
                <span className="border border-amber-300 bg-amber-50 text-amber-900 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wide rounded">
                  eTIMS Required
                </span>
              )}
            </div>

            <h1 className="text-2xl font-bold uppercase tracking-tight text-black font-sans">
              {clientRecord.name}
            </h1>

            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-zinc-600">
              <span className="border border-zinc-300 px-2 py-0.5 bg-zinc-50 font-semibold uppercase rounded text-zinc-700">
                Class: {clientRecord.clientType}
              </span>
              {clientRecord.taxPin && (
                <span className="bg-black text-white px-2 py-0.5 font-semibold uppercase tracking-wide rounded">
                  PIN: {clientRecord.taxPin}
                </span>
              )}
              <span className="text-zinc-400 font-mono text-[10px]">ID: {clientRecord.id}</span>
            </div>
          </div>
          
          {/* STREAMLINED ACTION CONTROLS */}
          <div className="flex items-center gap-2.5">
            <Link
              href={`/workspaces/${slug}/documents/new?clientId=${clientRecord.id}`}
              className="btn-primary-modern px-4 py-2 font-semibold uppercase tracking-wider text-xs shadow-sm flex items-center gap-1.5"
            >
              <span>+</span>
              <span>Generate Document</span>
            </Link>

            <ClientActionsPopover
              client={clientRecord}
              shop={shop}
              shopSlug={slug}
              matchedSupplier={matchedSupplier}
            />
          </div>
        </div>
      </div>

      {/* INDIVIDUAL PIPELINE FINANCIAL SUMMARY CARD BLOCKS */}
      <div className="card-modern divide-y md:divide-y-0 md:divide-x divide-zinc-200/80 bg-white grid grid-cols-1 md:grid-cols-3">
        <div className="p-6 space-y-1">
          <p className="font-mono text-xs text-zinc-400 uppercase font-semibold">Computed Lifetime Value (LTV)</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {formatCurrency(performanceMetrics.lifetimeValue, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Total settled invoice balances explicitly processed to date.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-xs text-zinc-400 uppercase font-semibold">Accounts Receivable Debt</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-black">
            {formatCurrency(performanceMetrics.outstandingLiability, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Pending un-settled balance vectors current in processing paths.</p>
        </div>

        <div className="p-6 space-y-1">
          <p className="font-mono text-xs text-zinc-400 uppercase font-semibold">Critically Overdue Pool</p>
          <p className="text-xl font-semibold font-mono tracking-tight text-rose-600">
            {formatCurrency(performanceMetrics.overdueLiability, shop.currency)}
          </p>
          <p className="text-[10px] text-zinc-500 leading-tight">Outstanding invoice values that have cleared their due date constraints.</p>
        </div>
      </div>

      {/* CORE CONTACT SCHEDULING DETAILS BOX */}
      <div className="card-modern p-4 bg-zinc-50/50 font-mono text-xs grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Email Address</span>
          <span className="font-sans font-semibold text-black text-sm">{clientRecord.email}</span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Phone Number</span>
          <span className="font-semibold text-black text-sm">{clientRecord.phone || "Not set"}</span>
        </div>
        <div>
          <span className="text-zinc-400 block uppercase text-[10px] font-semibold">Client Since</span>
          <span className="text-zinc-600 text-sm font-semibold">
            {new Date(clientRecord.createdAt).toLocaleDateString("en-KE", { dateStyle: "long" })}
          </span>
        </div>
      </div>

      {/* LOYALTY & MEMBERSHIP STATUS HUB */}
      {loyaltyProgram?.isEnabled && loyaltyProgram?.engineMode !== "OFF" && loyaltyAccount && (
        <div className="card-modern p-5 bg-white space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
              <h2 className="text-sm font-bold uppercase tracking-tight text-black font-sans">
                Loyalty &amp; Membership Rewards
              </h2>
              <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                {loyaltyProgram.programName || "Rewards Club"}
              </span>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs">
              <span className="text-zinc-400 uppercase text-[10px] font-semibold">Member ID:</span>
              <span className="px-2.5 py-0.5 bg-black text-white font-bold rounded">
                {loyaltyAccount.memberNumber}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1">
              <span className="text-[10px] text-zinc-400 font-mono font-semibold uppercase block">Membership Tier</span>
              <div className="flex items-center gap-1.5 pt-0.5">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block"
                  style={{ backgroundColor: (loyaltyAccount as any)?.tier?.badgeColor || "#000000" }}
                />
                <span className="text-sm font-bold text-black font-sans uppercase">
                  {(loyaltyAccount as any)?.tier?.name || "Standard Member"}
                </span>
              </div>
              {(loyaltyAccount as any)?.tier && parseFloat((loyaltyAccount as any).tier.discountPercent || "0") > 0 && (
                <span className="text-[10px] font-mono text-emerald-700 font-bold block">
                  {(loyaltyAccount as any).tier.discountPercent}% VIP Discount Benefit
                </span>
              )}
            </div>

            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1">
              <span className="text-[10px] text-zinc-400 font-mono font-semibold uppercase block">Available Points</span>
              <div className="text-xl font-bold text-black font-mono">
                {loyaltyAccount.currentPoints} <span className="text-xs text-zinc-500 font-normal">pts</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block">
                ≈ {formatCurrency(loyaltyAccount.currentPoints * (parseFloat(loyaltyProgram.pointValueKes) || 1), shop.currency)} redeemable
              </span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1">
              <span className="text-[10px] text-zinc-400 font-mono font-semibold uppercase block">Lifetime Points</span>
              <div className="text-xl font-bold text-zinc-700 font-mono">
                {loyaltyAccount.lifetimePoints} <span className="text-xs text-zinc-400 font-normal">pts</span>
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block">
                Total points earned to date
              </span>
            </div>

            <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200/80 space-y-1">
              <span className="text-[10px] text-zinc-400 font-mono font-semibold uppercase block">Earn Multiplier</span>
              <div className="text-xl font-bold text-zinc-700 font-mono">
                {(loyaltyAccount as any)?.tier?.pointsMultiplier ? `${(loyaltyAccount as any).tier.pointsMultiplier}x` : "1.0x"}
              </div>
              <span className="text-[10px] font-mono text-zinc-500 block">
                Points accrual acceleration
              </span>
            </div>
          </div>

          {/* RECENT POINTS LEDGER ENTRIES */}
          {(loyaltyAccount as any)?.ledgerEntries && (loyaltyAccount as any).ledgerEntries.length > 0 && (
            <div className="pt-2 border-t border-zinc-100 space-y-2">
              <span className="text-[10px] font-mono font-bold uppercase text-zinc-500 block">
                Recent Points Activity
              </span>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-[10px] uppercase text-zinc-400 bg-zinc-50/50">
                      <th className="p-2">Date</th>
                      <th className="p-2">Activity Type</th>
                      <th className="p-2">Description</th>
                      <th className="p-2 text-right">Points</th>
                      <th className="p-2 text-right">Balance After</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {((loyaltyAccount as any).ledgerEntries as any[]).slice(0, 5).map((entry: any) => (
                      <tr key={entry.id} className="hover:bg-zinc-50/50">
                        <td className="p-2 text-zinc-500 text-[11px]">
                          {new Date(entry.createdAt).toLocaleDateString("en-KE", { dateStyle: "short" })}
                        </td>
                        <td className="p-2">
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            entry.movementType === "ACCRUAL"
                              ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                              : entry.movementType === "REDEMPTION"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : "bg-zinc-100 text-zinc-700"
                          }`}>
                            {entry.movementType}
                          </span>
                        </td>
                        <td className="p-2 text-zinc-700 font-sans text-xs">{entry.description}</td>
                        <td className={`p-2 text-right font-bold ${
                          entry.points > 0 ? "text-emerald-700" : "text-rose-600"
                        }`}>
                          {entry.points > 0 ? `+${entry.points}` : entry.points}
                        </td>
                        <td className="p-2 text-right text-zinc-600">{entry.balanceAfter} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STANDALONE HISTORICAL SUB-LEDGER GRID (INSTANT 0MS CLIENT-SIDE FILTERING) */}
      <div className="space-y-4">
        <h3 className="font-semibold uppercase tracking-tight text-sm font-sans text-black">Documents &amp; Transactions</h3>
        
        <ClientDocumentsSubLedger
          documents={clientRecord.documents.map((d) => ({
            id: d.id,
            docNumber: d.docNumber,
            type: d.type,
            issueDate: d.issueDate,
            grandTotal: d.grandTotal,
            status: d.status,
            notes: d.notes,
          }))}
          slug={slug}
          currency={shop.currency}
        />
      </div>

    </div>
  );
}