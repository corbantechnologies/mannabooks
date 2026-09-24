"use client";

import { useState, useTransition } from "react";
import { decideApprovalRequestAction, createApprovalRequestAction, upsertApprovalPolicyAction } from "@/lib/actions/approvals";
import { formatCurrency } from "@/lib/utils";
import { toast } from "react-hot-toast";
import { Spinner } from "@/components/Spinner";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  FileCheck2,
  Plus,
  X,
  Check,
  Shield,
  Layers,
  ChevronRight,
  User,
} from "lucide-react";

interface ApprovalsClientProps {
  shopId: string;
  shopSlug: string;
  currency: string;
  currentUser: any;
  userRole: string;
  initialRequests: any[];
  initialPolicies: any[];
}

export function ApprovalsClient({
  shopId,
  shopSlug,
  currency,
  currentUser,
  userRole,
  initialRequests,
  initialPolicies,
}: ApprovalsClientProps) {
  const [activeTab, setActiveTab] = useState<"PENDING" | "MY_REQUESTS" | "ALL" | "POLICIES">("PENDING");
  const [requests, setRequests] = useState<any[]>(initialRequests);
  const [policies, setPolicies] = useState<any[]>(initialPolicies);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Create Request form state
  const [newType, setNewType] = useState<any>("PURCHASE_REQUISITION");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newPriority, setNewPriority] = useState<any>("NORMAL");

  const canApprove = userRole === "OWNER" || userRole === "ADMIN" || userRole === "MANAGER" || currentUser?.isSuperAdmin;

  const pendingCount = requests.filter((r) => r.status === "PENDING").length;
  const myRequestsCount = requests.filter((r) => r.requesterUserId === currentUser?.id).length;

  const filteredRequests = requests.filter((r) => {
    if (activeTab === "PENDING") return r.status === "PENDING";
    if (activeTab === "MY_REQUESTS") return r.requesterUserId === currentUser?.id;
    return true; // ALL
  });

  const handleDecision = async (decision: "APPROVE" | "REJECT", reason?: string) => {
    if (!selectedRequest) return;

    startTransition(async () => {
      const res = await decideApprovalRequestAction({
        shopId,
        requestId: selectedRequest.id,
        decision,
        reason,
      });

      if (res.success) {
        toast.success(`Request ${selectedRequest.requestNumber} ${decision === "APPROVE" ? "Approved" : "Rejected"}.`);
        setShowRejectModal(false);
        setRejectionReason("");
        setSelectedRequest(null);
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to process decision.");
      }
    });
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Please enter a title for the request.");
      return;
    }

    startTransition(async () => {
      const res = await createApprovalRequestAction({
        shopId,
        requestType: newType,
        title: newTitle.trim(),
        description: newDesc.trim() || undefined,
        amount: parseFloat(newAmount) || 0,
        currency,
        priority: newPriority,
        targetEntityType: "manual_request",
        targetEntityId: "00000000-0000-0000-0000-000000000000",
      });

      if (res.success) {
        toast.success(`Approval ticket ${res.requestNumber} submitted!`);
        setShowCreateModal(false);
        setNewTitle("");
        setNewDesc("");
        setNewAmount("");
        window.location.reload();
      } else {
        toast.error(res.error || "Failed to submit request.");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* HEADER METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="card-modern p-4 bg-white border border-zinc-200">
          <span className="font-mono text-[10px] uppercase font-bold text-amber-600 block">Pending Review</span>
          <span className="text-2xl font-bold font-sans text-black">{pendingCount}</span>
          <span className="text-[11px] text-zinc-400 block mt-0.5">Awaiting authorization</span>
        </div>
        <div className="card-modern p-4 bg-white border border-zinc-200">
          <span className="font-mono text-[10px] uppercase font-bold text-zinc-500 block">My Submissions</span>
          <span className="text-2xl font-bold font-sans text-black">{myRequestsCount}</span>
          <span className="text-[11px] text-zinc-400 block mt-0.5">Tickets raised by you</span>
        </div>
        <div className="card-modern p-4 bg-white border border-zinc-200">
          <span className="font-mono text-[10px] uppercase font-bold text-emerald-600 block">Approved Total</span>
          <span className="text-2xl font-bold font-sans text-black">
            {requests.filter((r) => r.status === "APPROVED").length}
          </span>
          <span className="text-[11px] text-zinc-400 block mt-0.5">Cleared downstream</span>
        </div>
        <div className="card-modern p-4 bg-white border border-zinc-200">
          <span className="font-mono text-[10px] uppercase font-bold text-blue-600 block">Active Policies</span>
          <span className="text-2xl font-bold font-sans text-black">
            {policies.filter((p) => p.isActive).length}
          </span>
          <span className="text-[11px] text-zinc-400 block mt-0.5">Governance rules active</span>
        </div>
      </div>

      {/* TABS & ACTION BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("PENDING")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "PENDING"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Pending Review ({pendingCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MY_REQUESTS")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "MY_REQUESTS"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            My Requests ({myRequestsCount})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("ALL")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "ALL"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            All History ({requests.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("POLICIES")}
            className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === "POLICIES"
                ? "bg-black text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Governance Policies ({policies.length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateModal(true)}
          className="bg-black hover:bg-zinc-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>+ New Request</span>
        </button>
      </div>

      {/* REQUESTS LIST */}
      {activeTab !== "POLICIES" && (
        <div className="card-modern bg-white overflow-hidden border border-zinc-200 divide-y divide-zinc-200">
          {filteredRequests.map((req) => (
            <div
              key={req.id}
              onClick={() => setSelectedRequest(req)}
              className="p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-zinc-50/70 transition-colors cursor-pointer group"
            >
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-black group-hover:underline">
                    {req.requestNumber}
                  </span>
                  <span className="border border-zinc-200 bg-zinc-50 px-2 py-0.5 rounded text-[10px] font-mono uppercase text-zinc-600">
                    {req.requestType.replace(/_/g, " ")}
                  </span>
                  {req.priority === "URGENT" && (
                    <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase">
                      URGENT
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-semibold text-black truncate">{req.title}</h4>
                <div className="flex items-center gap-3 text-[11px] text-zinc-400 font-sans">
                  <span>By: <strong className="text-zinc-700">{req.requester?.name || "Staff"}</strong></span>
                  <span>•</span>
                  <span>{new Date(req.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <span className="text-sm font-bold font-mono text-black block">
                    {formatCurrency(req.amount, req.currency || currency)}
                  </span>
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase mt-0.5 ${
                      req.status === "APPROVED"
                        ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                        : req.status === "REJECTED"
                        ? "bg-red-50 text-red-800 border border-red-200"
                        : "bg-amber-50 text-amber-800 border border-amber-200"
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-black transition-colors" />
              </div>
            </div>
          ))}

          {filteredRequests.length === 0 && (
            <div className="p-12 text-center text-zinc-400 italic text-xs">
              No approval tickets found in this view.
            </div>
          )}
        </div>
      )}

      {/* POLICIES TAB */}
      {activeTab === "POLICIES" && (
        <div className="card-modern bg-white overflow-hidden border border-zinc-200">
          <div className="p-4 bg-zinc-50 border-b border-zinc-200 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs uppercase tracking-wider text-black">
                Workspace Governance Rules &amp; Caps
              </h3>
              <p className="text-[11px] text-zinc-500 font-sans mt-0.5">
                Configured thresholds that automatically route transactions through supervisor authorization.
              </p>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 bg-white border border-zinc-200 px-2 py-0.5 rounded">
              {policies.length} Policies Active
            </span>
          </div>

          <div className="divide-y divide-zinc-200 text-xs">
            {policies.map((pol) => (
              <div key={pol.id} className="p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-black">{pol.name}</span>
                    <span className="bg-zinc-100 text-zinc-600 font-mono text-[10px] px-1.5 py-0.5 rounded uppercase">
                      {pol.requestType.replace(/_/g, " ")}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">
                    Auto-approved below: <strong className="text-black">{formatCurrency(pol.autoApproveBelow, currency)}</strong>. Amounts above require <strong className="text-black">{pol.requiredRole}</strong> authorization.
                  </p>
                </div>
                <span className="border border-emerald-200 bg-emerald-50 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                  ACTIVE RULE
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SLIDE-OVER REVIEW DRAWER */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex justify-end z-50">
          <div className="w-full max-w-lg bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="space-y-6">
              {/* HEADER */}
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-bold text-black">
                      {selectedRequest.requestNumber}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        selectedRequest.status === "APPROVED"
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : selectedRequest.status === "REJECTED"
                          ? "bg-red-50 text-red-800 border border-red-200"
                          : "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {selectedRequest.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-black mt-1">{selectedRequest.title}</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="text-zinc-400 hover:text-black cursor-pointer bg-transparent border-none"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* PARTICULARS */}
              <div className="bg-zinc-50 border border-zinc-200 rounded p-4 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-zinc-500">Request Type:</span>
                  <span className="font-semibold text-black">{selectedRequest.requestType.replace(/_/g, " ")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Value / Amount:</span>
                  <span className="font-bold text-black font-mono text-sm">
                    {formatCurrency(selectedRequest.amount, selectedRequest.currency || currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Requester:</span>
                  <span className="font-semibold text-black">{selectedRequest.requester?.name} ({selectedRequest.requester?.email})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-500">Priority:</span>
                  <span className="font-bold text-black uppercase">{selectedRequest.priority}</span>
                </div>
                {selectedRequest.description && (
                  <div className="pt-2 border-t border-zinc-200">
                    <span className="text-zinc-500 block mb-1">Description / Notes:</span>
                    <p className="text-zinc-700 bg-white p-2.5 rounded border border-zinc-200 text-xs leading-relaxed">
                      {selectedRequest.description}
                    </p>
                  </div>
                )}
                {selectedRequest.decisionReason && (
                  <div className="pt-2 border-t border-zinc-200">
                    <span className="text-zinc-500 block mb-1">Reviewer Feedback:</span>
                    <p className="text-zinc-800 bg-amber-50/60 p-2.5 rounded border border-amber-200 text-xs">
                      {selectedRequest.decisionReason}
                    </p>
                  </div>
                )}
              </div>

              {/* TIMELINE FEED */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-black block">
                  Audit Timeline
                </span>
                <div className="space-y-2 border-l-2 border-zinc-200 pl-3">
                  {selectedRequest.timeline?.map((event: any) => (
                    <div key={event.id} className="text-xs space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-black">{event.action}</span>
                        <span className="text-[10px] text-zinc-400 font-mono">
                          {new Date(event.createdAt).toLocaleDateString("en-KE", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <p className="text-zinc-600 text-[11px]">{event.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ACTION FOOTER */}
            {selectedRequest.status === "PENDING" && canApprove ? (
              <div className="pt-6 border-t border-zinc-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={isPending}
                  className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 font-bold text-xs uppercase tracking-wider rounded cursor-pointer transition-all"
                >
                  Reject Request
                </button>
                <button
                  type="button"
                  onClick={() => handleDecision("APPROVE")}
                  disabled={isPending}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2 rounded flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  {isPending ? <Spinner size={14} /> : <Check className="w-4 h-4" />}
                  <span>Approve &amp; Finalize</span>
                </button>
              </div>
            ) : (
              <div className="pt-6 border-t border-zinc-200 flex justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="btn-secondary-modern px-5 py-2 text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-60">
          <div className="card-modern max-w-sm w-full bg-white p-5 space-y-4 shadow-2xl">
            <h4 className="font-bold text-sm text-black flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <span>Provide Reason for Rejection</span>
            </h4>
            <p className="text-xs text-zinc-500 font-sans">
              A mandatory explanation is required to maintain operational transparency.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Price exceeds quotation; supplier alternative selected."
              rows={3}
              className="w-full border border-zinc-300 rounded p-2 text-xs font-sans focus:outline-black"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 border border-zinc-300 text-xs rounded font-semibold text-zinc-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDecision("REJECT", rejectionReason)}
                disabled={isPending || rejectionReason.trim().length < 5}
                className="bg-red-700 hover:bg-red-800 text-white text-xs font-bold uppercase px-4 py-1.5 rounded disabled:opacity-50"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE REQUEST MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card-modern max-w-md w-full bg-white p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <h3 className="font-bold text-sm uppercase tracking-wider text-black flex items-center gap-2">
                <FileCheck2 className="w-4 h-4" />
                <span>Submit Approval Ticket</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-zinc-400 hover:text-black cursor-pointer bg-transparent border-none"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Request Type *
                </label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-sans bg-white focus:outline-black"
                >
                  <option value="PURCHASE_REQUISITION">Purchase Requisition (Buy goods/services)</option>
                  <option value="EXPENSE_CLAIM">Expense Claim (Staff out-of-pocket reimbursement)</option>
                  <option value="CREDIT_NOTE">Credit Note / Refund Authorization</option>
                  <option value="STOCK_ADJUSTMENT">Stock Write-Off (Damaged/Missing inventory)</option>
                  <option value="BUDGET_OVERRUN">Budget Ceiling Override</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Title / Subject *
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. 200 bags of cement for site project"
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-sans focus:outline-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Value / Amount ({currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newAmount}
                    onChange={(e) => setNewAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-mono focus:outline-black"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                    Priority
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full border border-zinc-300 rounded p-2 text-xs font-sans bg-white focus:outline-black"
                  >
                    <option value="NORMAL">Normal</option>
                    <option value="HIGH">High Priority</option>
                    <option value="URGENT">Urgent (Same-Day)</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-600 mb-1">
                  Justification &amp; Notes
                </label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Provide supporting business context for your supervisor..."
                  rows={3}
                  className="w-full border border-zinc-300 rounded p-2 text-xs font-sans focus:outline-black"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-zinc-300 rounded text-xs font-semibold text-zinc-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="bg-black text-white hover:bg-zinc-800 px-5 py-2 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isPending ? <Spinner size={14} /> : <Check className="w-3.5 h-3.5" />}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
