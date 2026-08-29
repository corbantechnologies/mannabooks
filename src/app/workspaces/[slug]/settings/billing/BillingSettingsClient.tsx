"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { type ShopPlanDetails, type PlanDefinition } from "@/lib/paywall";
import { initiateSubscriptionPaymentAction, checkPaymentStatusAction } from "@/lib/actions/billing";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface BillingSettingsClientProps {
  shop: any;
  planDetails: ShopPlanDetails;
  availablePlans: PlanDefinition[];
  transactions: any[];
}

export function BillingSettingsClient({
  shop,
  planDetails,
  availablePlans,
  transactions,
}: BillingSettingsClientProps) {
  const router = useRouter();
  const [selectedDuration, setSelectedDuration] = useState<number>(1); // 1, 3, 12 months

  // M-Pesa STK Modal State
  const [targetPlan, setTargetPlan] = useState<PlanDefinition | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>(shop.phone || "");
  const [isSubmittingStk, setIsSubmittingStk] = useState<boolean>(false);
  const [activeTxId, setActiveTxId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [pollCountdown, setPollCountdown] = useState<number>(45);
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<string | null>(null);

  // Discount calculation
  const discountMultiplier = selectedDuration >= 12 ? 0.8 : selectedDuration >= 3 ? 0.9 : 1.0;

  // Poll status while activeTxId is set
  useEffect(() => {
    let interval: any = null;
    let timer: any = null;

    if (activeTxId && isPolling) {
      interval = setInterval(async () => {
        const res = await checkPaymentStatusAction(activeTxId);
        if (res.success && res.status === "COMPLETED") {
          setIsPolling(false);
          setPaymentSuccessReceipt(res.mpesaReceipt || "SUCCESS");
          toast.success("🎉 Payment verified! Workspace upgraded!");
          router.refresh();
        } else if (res.status === "FAILED") {
          setIsPolling(false);
          toast.error("M-Pesa transaction failed or was cancelled.");
        }
      }, 2500);

      timer = setInterval(() => {
        setPollCountdown((prev) => {
          if (prev <= 1) {
            setIsPolling(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
      if (timer) clearInterval(timer);
    };
  }, [activeTxId, isPolling, router]);

  async function handleInitiateStk(e: React.FormEvent) {
    e.preventDefault();
    if (!targetPlan) return;

    if (!phoneNumber.trim()) {
      toast.error("Please enter your Safaricom M-Pesa phone number.");
      return;
    }

    setIsSubmittingStk(true);
    const toastId = toast.loading("Sending M-Pesa STK Push to your phone...");

    const res = await initiateSubscriptionPaymentAction({
      shopId: shop.id,
      plan: targetPlan.id as any,
      months: selectedDuration,
      phoneNumber: phoneNumber.trim(),
    });

    setIsSubmittingStk(false);

    if (!res.success || !res.transactionId) {
      toast.error(res.error || "Failed to initiate M-Pesa payment.", { id: toastId });
    } else {
      toast.success(res.customerMessage || "Prompt sent! Check your phone.", { id: toastId });
      setActiveTxId(res.transactionId);
      setIsPolling(true);
      setPollCountdown(45);
    }
  }

  function handleCloseModal() {
    setTargetPlan(null);
    setActiveTxId(null);
    setIsPolling(false);
    setPaymentSuccessReceipt(null);
  }

  return (
    <div className="space-y-10 font-sans">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 font-mono text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
            <Link href={`/workspaces/${shop.slug}/settings`} className="hover:text-black underline">
              Settings
            </Link>
            <span>/</span>
            <span>Billing &amp; Subscriptions</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black mt-1">
            Subscription &amp; Quotas
          </h1>
          <p className="text-xs text-zinc-600 font-mono mt-1">
            Manage your commercial plan tier, team member quotas, multi-location stock, and Lipa Na M-Pesa automated billing.
          </p>
        </div>
      </div>

      {/* ACTIVE PLAN SUMMARY CARD */}
      <div className="bg-white border border-zinc-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-5">
          <div className="space-y-1">
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
              Active Subscription
            </span>
            <div className="flex items-center gap-3">
              <h2 className="text-xl sm:text-2xl font-black text-black uppercase">
                {planDetails.isLifetimePro ? "Professional (Whitelisted)" : planDetails.planSpec.name}
              </h2>
              {planDetails.isLifetimePro ? (
                <span className="bg-amber-100 text-amber-900 border border-amber-300 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded shadow-2xs">
                  👑 LIFETIME PRO
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-300 font-mono font-bold text-[10px] px-2.5 py-0.5 rounded">
                  {planDetails.subscriptionStatus}
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-500 font-mono">
              {planDetails.planSpec.tagline}
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs space-y-0.5">
            {planDetails.isLifetimePro ? (
              <div className="text-amber-800 font-bold">
                Permanent Exemption • Zero Recurring Billing
              </div>
            ) : planDetails.expiresAt ? (
              <div>
                <span className="text-zinc-400 block text-[10px] uppercase">Renewal Expiration</span>
                <span className="font-bold text-black text-sm">
                  {new Date(planDetails.expiresAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                </span>
                <span className="text-[10px] text-zinc-500 block">
                  ({planDetails.daysRemaining} days remaining)
                </span>
              </div>
            ) : (
              <span className="text-zinc-500 font-bold">Free Community Tier</span>
            )}
          </div>
        </div>

        {/* QUOTA UTILIZATION GAUGES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
          
          {/* Team Members Gauge */}
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Team Members Quota</span>
            <div className="text-lg font-black text-black">
              {planDetails.currentMembersCount} / {planDetails.planSpec.maxMembers === Infinity ? "∞" : planDetails.planSpec.maxMembers}
            </div>
            <span className="text-[10px] text-zinc-500 block">
              {planDetails.canAddMember ? "Capacity available" : "Limit reached (Upgrade to invite)"}
            </span>
          </div>

          {/* Stock Locations Gauge */}
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">Physical Stock Locations</span>
            <div className="text-lg font-black text-black">
              {planDetails.currentLocationsCount} / {planDetails.planSpec.maxLocations === Infinity ? "∞" : planDetails.planSpec.maxLocations}
            </div>
            <span className="text-[10px] text-zinc-500 block">
              {planDetails.canAddLocation ? "Capacity available" : "Limit reached (Basic: 3, Pro: Unlimited)"}
            </span>
          </div>

          {/* General Ledger & Reports Status */}
          <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase block">General Ledger &amp; Reports</span>
            <div className={`text-lg font-black ${planDetails.canAccessGL ? "text-emerald-700" : "text-zinc-400"}`}>
              {planDetails.canAccessGL ? "UNLOCKED" : "LOCKED"}
            </div>
            <span className="text-[10px] text-zinc-500 block">
              {planDetails.canAccessGL ? "Full Balance Sheet & Recon active" : "Requires Professional Tier"}
            </span>
          </div>

        </div>
      </div>

      {/* PLAN SELECTOR & DURATION TOGGLE */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-black">
              Available Plan Tiers
            </h2>
            <p className="text-xs text-zinc-500 font-mono">
              Select a tier to upgrade your workspace via instant Safaricom M-Pesa STK Push.
            </p>
          </div>

          {/* DURATION PILL SELECTOR */}
          <div className="flex items-center gap-1 bg-zinc-100 p-1 rounded-lg border border-zinc-200 font-mono text-xs font-bold">
            <button
              type="button"
              onClick={() => setSelectedDuration(1)}
              className={`px-3 py-1.5 rounded-md transition-all ${
                selectedDuration === 1 ? "bg-black text-white shadow-2xs" : "text-zinc-600 hover:text-black"
              }`}
            >
              1 Month
            </button>
            <button
              type="button"
              onClick={() => setSelectedDuration(3)}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                selectedDuration === 3 ? "bg-black text-white shadow-2xs" : "text-zinc-600 hover:text-black"
              }`}
            >
              <span>3 Months</span>
              <span className="text-[9px] bg-amber-400 text-black px-1 rounded font-bold">10% OFF</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedDuration(12)}
              className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-1 ${
                selectedDuration === 12 ? "bg-black text-white shadow-2xs" : "text-zinc-600 hover:text-black"
              }`}
            >
              <span>1 Year</span>
              <span className="text-[9px] bg-emerald-400 text-black px-1 rounded font-bold">20% OFF</span>
            </button>
          </div>
        </div>

        {/* PRICING CARDS MATRIX */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {availablePlans.filter(p => p.id !== "ENTERPRISE").map((plan) => {
            const isCurrent = planDetails.plan === plan.id && !planDetails.isLifetimePro;
            const calculatedTotal = Math.round(plan.priceKesMonthly * selectedDuration * discountMultiplier);

            return (
              <div
                key={plan.id}
                className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between relative transition-all ${
                  plan.id === "PRO"
                    ? "border-black ring-1 ring-black"
                    : "border-zinc-200/80 hover:border-zinc-400"
                }`}
              >
                {plan.id === "PRO" && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-black text-white font-mono text-[9px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                    Most Popular for Retailers
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black uppercase text-black">{plan.name}</h3>
                    <p className="text-xs text-zinc-500 font-mono mt-0.5 leading-tight">{plan.tagline}</p>
                  </div>

                  {/* PRICE DISPLAY */}
                  <div className="border-y border-zinc-100 py-4 space-y-1">
                    <div className="flex items-baseline gap-1 font-mono">
                      <span className="text-2xl sm:text-3xl font-black text-black">
                        {plan.priceKesMonthly === 0 ? "FREE" : formatCurrency(calculatedTotal, "KES")}
                      </span>
                      {plan.priceKesMonthly > 0 && (
                        <span className="text-xs text-zinc-500">
                          / {selectedDuration === 1 ? "mo" : `${selectedDuration} mos`}
                        </span>
                      )}
                    </div>
                    {selectedDuration > 1 && plan.priceKesMonthly > 0 && (
                      <span className="text-[10px] text-emerald-700 font-mono font-bold block">
                        Equivalent to {formatCurrency(Math.round(calculatedTotal / selectedDuration), "KES")}/month
                      </span>
                    )}
                  </div>

                  {/* FEATURES CHECKLIST */}
                  <div className="space-y-2 font-mono text-xs text-zinc-700 pt-1">
                    {plan.features.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-600 font-bold">✓</span>
                        <span className="leading-snug">{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-zinc-100">
                  {isCurrent ? (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-zinc-100 text-zinc-500 font-mono font-bold text-xs uppercase py-2.5 rounded-lg cursor-default border border-zinc-200"
                    >
                      Active Plan
                    </button>
                  ) : planDetails.isLifetimePro ? (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-amber-50 text-amber-800 font-mono font-bold text-xs uppercase py-2.5 rounded-lg cursor-default border border-amber-200"
                    >
                      👑 Lifetime Exemption Active
                    </button>
                  ) : plan.priceKesMonthly === 0 ? (
                    <button
                      type="button"
                      disabled
                      className="w-full bg-zinc-100 text-zinc-400 font-mono font-bold text-xs uppercase py-2.5 rounded-lg cursor-default border border-zinc-200"
                    >
                      Included
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setTargetPlan(plan);
                        setPhoneNumber(shop.phone || "");
                        setPaymentSuccessReceipt(null);
                        setActiveTxId(null);
                      }}
                      className="w-full bg-black hover:bg-zinc-800 text-white font-mono font-bold text-xs uppercase py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <span>⚡</span>
                      <span>Upgrade with M-Pesa</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* BILLING TRANSACTIONS HISTORY TABLE */}
      <div className="space-y-4">
        <h2 className="text-xl font-black uppercase tracking-tight text-black">
          Billing &amp; Payment Receipts ({transactions.length})
        </h2>

        <div className="bg-white border border-zinc-200/80 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] text-zinc-400 uppercase font-bold tracking-wider">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">M-Pesa Receipt</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4 text-right">Amount (KES)</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-zinc-800">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-zinc-400 font-mono text-xs">
                      No past billing transactions on record for this workspace.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono text-zinc-500 text-[11px]">
                        {new Date(tx.createdAt).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                      </td>
                      <td className="py-3 px-4 font-bold text-black">
                        MannaBooks {tx.targetPlan} Plan ({tx.billingMonths} mo{tx.billingMonths !== 1 ? "s" : ""})
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-zinc-700">
                        {tx.mpesaReceiptNumber || "PENDING"}
                      </td>
                      <td className="py-3 px-4 font-mono text-zinc-500">
                        {tx.phoneNumber}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-900">
                        {formatCurrency(tx.amount, "KES")}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase border ${
                            tx.status === "COMPLETED"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : tx.status === "FAILED"
                              ? "bg-rose-50 text-rose-800 border-rose-300"
                              : "bg-amber-50 text-amber-800 border-amber-300"
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* M-PESA STK PUSH CHECKOUT MODAL */}
      {targetPlan && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-zinc-300 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 space-y-6 animate-in zoom-in-95 font-sans">
            
            {/* MODAL HEADER */}
            <div className="flex justify-between items-start border-b border-zinc-200 pb-3">
              <div>
                <span className="font-mono text-[10px] text-zinc-400 uppercase font-bold">Lipa Na M-Pesa Online</span>
                <h3 className="text-lg font-black text-black uppercase">
                  Upgrade to {targetPlan.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-zinc-400 hover:text-black font-bold p-1 text-base"
              >
                ✕
              </button>
            </div>

            {/* PAYMENT SUCCESS STATE */}
            {paymentSuccessReceipt ? (
              <div className="text-center space-y-4 py-4 font-mono">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto text-2xl">
                  ✓
                </div>
                <div className="space-y-1">
                  <h4 className="text-lg font-bold font-sans text-black uppercase">Payment Successful!</h4>
                  <p className="text-xs text-zinc-600">
                    Receipt Ref: <strong className="text-black">{paymentSuccessReceipt}</strong>
                  </p>
                  <p className="text-xs text-emerald-700 font-bold mt-2">
                    Your workspace has been upgraded to {targetPlan.name}. All features are now unlocked!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="w-full bg-black text-white font-bold uppercase text-xs py-3 rounded-lg mt-4"
                >
                  Done &amp; Continue
                </button>
              </div>
            ) : isPolling ? (
              /* POLLING / WAITING FOR USER PIN STATE */
              <div className="text-center space-y-5 py-4 font-mono">
                <div className="w-14 h-14 border-4 border-black border-t-transparent rounded-full animate-spin mx-auto"></div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold font-sans text-black uppercase">Check Your Phone</h4>
                  <p className="text-xs text-zinc-600">
                    An M-Pesa STK push prompt for <strong>{formatCurrency(Math.round(targetPlan.priceKesMonthly * selectedDuration * discountMultiplier), "KES")}</strong> was dispatched to <strong>{phoneNumber}</strong>.
                  </p>
                  <p className="text-xs text-zinc-400 pt-2">
                    Please enter your 4-digit M-Pesa PIN on your phone to authorize.
                  </p>
                  <div className="text-xs font-bold text-amber-700 pt-1">
                    Waiting for confirmation... ({pollCountdown}s)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="text-xs text-zinc-400 hover:text-black underline pt-2"
                >
                  Cancel or Retry
                </button>
              </div>
            ) : (
              /* STK FORM STATE */
              <form onSubmit={handleInitiateStk} className="space-y-5 font-mono text-xs">
                
                {/* SUMMARY ROW */}
                <div className="bg-zinc-50 border border-zinc-200 p-4 rounded-xl space-y-2">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Plan Tier:</span>
                    <span className="font-bold text-black">{targetPlan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Billing Duration:</span>
                    <span className="font-bold text-black">{selectedDuration} Month{selectedDuration > 1 ? "s" : ""}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-200 pt-2 text-sm">
                    <span className="font-bold text-black">Total Amount:</span>
                    <span className="font-black text-emerald-900">
                      {formatCurrency(Math.round(targetPlan.priceKesMonthly * selectedDuration * discountMultiplier), "KES")}
                    </span>
                  </div>
                </div>

                {/* PHONE NUMBER INPUT */}
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-zinc-700 uppercase block">
                    M-Pesa Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="e.g. 0712345678 or 2547..."
                    required
                    className="w-full px-3.5 py-2.5 border border-zinc-300 rounded-lg text-sm font-mono focus:outline-none focus:border-black bg-white"
                  />
                  <p className="text-[10px] text-zinc-400">
                    A secure prompt will appear instantly on this phone to enter your PIN.
                  </p>
                </div>

                <div className="pt-2 border-t border-zinc-200 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 border border-zinc-300 hover:bg-zinc-100 font-bold uppercase text-[11px] rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingStk}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold uppercase text-[11px] px-5 py-2.5 rounded-lg shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <span>⚡</span>
                    <span>{isSubmittingStk ? "Sending STK..." : "Send STK Push"}</span>
                  </button>
                </div>

              </form>
            )}

          </div>
        </div>
      )}

    </div>
  );
}
