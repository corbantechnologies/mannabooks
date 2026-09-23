// src/app/portal/proposal/[token]/page.tsx
import { db } from "@/db";
import { proposalTokens, proposals, proposalItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { formatCurrency } from "@/lib/utils";
import { ProposalPortalActions } from "./ProposalPortalActions";
import { markProposalViewedAction } from "@/lib/actions/proposals";

interface ProposalPortalPageProps {
  params: Promise<{ token: string }>;
}

export default async function PublicProposalPortalPage({ params }: ProposalPortalPageProps) {
  const { token } = await params;

  // Resolve token → proposal
  const tokenRec = await db.query.proposalTokens.findFirst({
    where: eq(proposalTokens.token, token),
    with: {
      proposal: {
        with: {
          shop: { with: { owner: true } },
          client: true,
          deal: true,
          items: { orderBy: [proposalItems.displayOrder] },
        },
      },
    },
  });

  if (!tokenRec?.proposal) notFound();
  const proposal = tokenRec.proposal;

  // Silently bump view count (fire-and-forget, does not block SSR)
  markProposalViewedAction(token).catch(() => {});

  const isExpired = proposal.expiresAt ? new Date(proposal.expiresAt) < new Date() : false;
  const isTerminal = ["ACCEPTED", "DECLINED"].includes(proposal.status);
  const subtotal = proposal.items.reduce((s, it) => s + parseFloat(String(it.itemTotal)), 0);

  const shopBrandColor = "#059669"; // default — shop branding can be extended later

  // Group items by packageLabel (multi-tier proposals)
  const hasTiers = proposal.items.some(it => it.packageLabel);
  const tiers = hasTiers
    ? Array.from(new Set(proposal.items.map(it => it.packageLabel || "Standard")))
    : ["Standard"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 text-white">
      {/* Topbar */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/70 border-b border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold"
              style={{ backgroundColor: shopBrandColor }}
            >
              {(proposal.shop?.name || "MB").charAt(0)}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{proposal.shop?.name || "Business"}</p>
              <p className="text-[11px] text-gray-400">{proposal.shop?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              proposal.status === "ACCEPTED" ? "bg-emerald-500/15 text-emerald-400" :
              proposal.status === "DECLINED" ? "bg-red-500/15 text-red-400" :
              proposal.status === "AMENDMENT_REQUESTED" ? "bg-amber-500/15 text-amber-400" :
              isExpired ? "bg-red-500/15 text-red-400" :
              "bg-blue-500/15 text-blue-400"
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {proposal.status === "ACCEPTED" ? "Accepted ✓" :
               proposal.status === "DECLINED" ? "Declined" :
               proposal.status === "AMENDMENT_REQUESTED" ? "Amendment Requested" :
               isExpired ? "Expired" : "Open for Response"}
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-10">
        {/* Hero */}
        <div className="text-center space-y-3">
          <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">{proposal.proposalNumber}</p>
          <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{proposal.title}</h1>
          {proposal.expiresAt && (
            <p className={`text-sm ${isExpired ? "text-red-400" : "text-gray-400"}`}>
              {isExpired ? "⚠️ This proposal has expired." : `Valid until ${new Date(proposal.expiresAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`}
            </p>
          )}
        </div>

        {/* Executive Summary */}
        {proposal.executiveSummary && (
          <section className="rounded-2xl border border-white/8 bg-white/3 p-7">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-medium">Executive Summary</h2>
            <p className="text-gray-300 text-sm leading-7 whitespace-pre-line">{proposal.executiveSummary}</p>
          </section>
        )}

        {/* Scope of Work */}
        {proposal.scopeOfWork && (
          <section className="rounded-2xl border border-white/8 bg-white/3 p-7">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-medium">Scope of Work</h2>
            <div className="text-gray-300 text-sm leading-7 whitespace-pre-line">{proposal.scopeOfWork}</div>
          </section>
        )}

        {/* Pricing — single tier */}
        {!hasTiers && (
          <section className="rounded-2xl border border-white/8 bg-white/3 p-7">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-5 font-medium">Investment Summary</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 text-left text-gray-500 text-xs">
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium text-right w-16">Qty</th>
                    <th className="pb-3 font-medium text-right w-28">Unit Price</th>
                    <th className="pb-3 font-medium text-right w-28">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {proposal.items.map((item) => (
                    <tr key={item.id} className="py-3">
                      <td className="py-3 pr-4">
                        <p className="text-white font-medium">{item.description}</p>
                        {item.notes && <p className="text-gray-500 text-xs mt-0.5">{item.notes}</p>}
                      </td>
                      <td className="py-3 text-right text-gray-400">{parseFloat(String(item.quantity))}</td>
                      <td className="py-3 text-right text-gray-400">
                        {formatCurrency(parseFloat(String(item.unitPrice)), proposal.currency)}
                      </td>
                      <td className="py-3 text-right text-white font-semibold">
                        {formatCurrency(parseFloat(String(item.itemTotal)), proposal.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-white/8">
                    <td colSpan={3} className="pt-4 text-right font-semibold text-gray-300">Total</td>
                    <td className="pt-4 text-right text-xl font-bold" style={{ color: shopBrandColor }}>
                      {formatCurrency(subtotal, proposal.currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        )}

        {/* Pricing — multi-tier packages */}
        {hasTiers && (
          <section className="space-y-4">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 font-medium">Pricing Packages</h2>
            <div className={`grid gap-4 ${tiers.length === 2 ? "md:grid-cols-2" : tiers.length >= 3 ? "md:grid-cols-3" : "grid-cols-1"}`}>
              {tiers.map((tier) => {
                const tierItems = proposal.items.filter(it => (it.packageLabel || "Standard") === tier);
                const tierTotal = tierItems.reduce((s, it) => s + parseFloat(String(it.itemTotal)), 0);
                return (
                  <div key={tier} className="rounded-2xl border border-white/10 bg-white/4 p-6 flex flex-col gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-gray-500 font-medium">{tier}</p>
                      <p className="text-2xl font-bold text-white mt-1">{formatCurrency(tierTotal, proposal.currency)}</p>
                    </div>
                    <ul className="space-y-2">
                      {tierItems.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm text-gray-300">
                          <span className="mt-0.5 text-emerald-400">✓</span>
                          <span>{item.description}{item.notes ? ` — ${item.notes}` : ""}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Terms & Conditions */}
        {proposal.termsAndConditions && (
          <section className="rounded-2xl border border-white/8 bg-white/3 p-7">
            <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4 font-medium">Terms & Conditions</h2>
            <p className="text-gray-400 text-xs leading-6 whitespace-pre-line">{proposal.termsAndConditions}</p>
          </section>
        )}

        {/* Amendment message if already responded */}
        {proposal.status === "AMENDMENT_REQUESTED" && proposal.amendmentNotes && (
          <section className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-7">
            <h2 className="text-xs uppercase tracking-widest text-amber-400 mb-3 font-medium">Amendment Request Submitted</h2>
            <p className="text-amber-200 text-sm">{proposal.amendmentNotes}</p>
            <p className="text-amber-500/60 text-xs mt-3">The merchant will revise the proposal and send you an updated version.</p>
          </section>
        )}

        {/* Accepted confirmation */}
        {proposal.status === "ACCEPTED" && (
          <section className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-7 text-center space-y-2">
            <div className="text-4xl">🎉</div>
            <h2 className="text-lg font-semibold text-emerald-400">Proposal Accepted</h2>
            <p className="text-gray-400 text-sm">Signed by <strong className="text-white">{proposal.signerName}</strong>. The merchant has been notified.</p>
          </section>
        )}

        {/* CTA — only show if not terminal and not expired */}
        {!isTerminal && !isExpired && (
          <ProposalPortalActions
            token={token}
            proposalTitle={proposal.title}
            clientName={proposal.client?.name || proposal.deal?.contactName || ""}
            shopBrandColor={shopBrandColor}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 mt-16 py-8 text-center text-xs text-gray-600">
        Powered by{" "}
        <span className="text-gray-500 font-medium">Manna Books</span> · Corban Technologies
      </footer>
    </div>
  );
}
