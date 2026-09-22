"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import {
  createVendorBill,
  approveVendorBill,
  payVendorBill,
  cancelVendorBill,
  deleteVendorBill,
  type CreateVendorBillInput,
  type PayVendorBillInput,
} from "@/lib/actions/bills";

export interface SerializedBillItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  totalAmount: string;
  account: {
    id: string;
    code: string;
    name: string;
  } | null;
}

export interface SerializedBill {
  id: string;
  billNumber: string;
  reference: string | null;
  billDate: string;
  dueDate: string | null;
  subTotal: string;
  taxAmount: string;
  whtRate: string;
  whtAmount: string;
  totalAmount: string;
  netPayable: string;
  amountPaid: string;
  status: string;
  paymentChannel: string | null;
  paymentReference: string | null;
  notes: string | null;
  supplier: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    taxPin: string | null;
  };
  items: SerializedBillItem[];
}

export interface SerializedSupplier {
  id: string;
  name: string;
  email: string;
  taxPin: string | null;
  paymentTerms: string | null;
}

export interface SerializedAccount {
  id: string;
  code: string;
  name: string;
  accountType: string;
}

interface VendorBillsClientProps {
  shopSlug: string;
  shopName: string;
  currency: string;
  isGlEnabled: boolean;
  initialBills: SerializedBill[];
  suppliers: SerializedSupplier[];
  accounts: SerializedAccount[];
}

export function VendorBillsClient({
  shopSlug,
  shopName,
  currency,
  isGlEnabled,
  initialBills,
  suppliers,
  accounts,
}: VendorBillsClientProps) {
  const [bills, setBills] = useState<SerializedBill[]>(initialBills);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // Form Fields
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || "");
  const [reference, setReference] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [whtRate, setWhtRate] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const defaultExpenseAccount = accounts.find((a) => a.code === "6900" || a.accountType === "EXPENSE") || accounts[0];

  const [formItems, setFormItems] = useState([
    {
      accountId: defaultExpenseAccount?.id || "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
    },
  ]);

  // Payment Modal State
  const [payingBill, setPayingBill] = useState<SerializedBill | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>("");
  const [paymentChannel, setPaymentChannel] = useState("BANK");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  // Remittance Voucher Modal State
  const [voucherBill, setVoucherBill] = useState<SerializedBill | null>(null);

  // Computed Form Metrics
  const formCalculations = useMemo(() => {
    let sub = 0;
    let tax = 0;
    formItems.forEach((it) => {
      const lineSub = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      const lineTax = lineSub * ((Number(it.taxRate) || 0) / 100);
      sub += lineSub;
      tax += lineTax;
    });
    const gross = sub + tax;
    const wht = sub * (whtRate / 100);
    const net = Math.max(0, gross - wht);
    return { subTotal: sub, taxAmount: tax, grossTotal: gross, whtAmount: wht, netPayable: net };
  }, [formItems, whtRate]);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.billNumber.toLowerCase().includes(q) ||
        (b.reference && b.reference.toLowerCase().includes(q)) ||
        b.supplier.name.toLowerCase().includes(q) ||
        (b.supplier.taxPin && b.supplier.taxPin.toLowerCase().includes(q));
      return matchesStatus && matchesSearch;
    });
  }, [bills, statusFilter, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalOutstanding = 0;
    let overdueAmt = 0;
    let pendingApprovalCount = 0;
    let totalWht = 0;
    const now = new Date();

    bills.forEach((b) => {
      const net = parseFloat(b.netPayable || "0");
      const paid = parseFloat(b.amountPaid || "0");
      const balance = Math.max(0, net - paid);

      if (b.status === "APPROVED" || b.status === "PARTIALLY_PAID") {
        totalOutstanding += balance;
        if (b.dueDate && new Date(b.dueDate) < now) {
          overdueAmt += balance;
        }
      }

      if (b.status === "DRAFT" || b.status === "AWAITING_APPROVAL") {
        pendingApprovalCount += 1;
      }

      totalWht += parseFloat(b.whtAmount || "0");
    });

    return { totalOutstanding, overdueAmt, pendingApprovalCount, totalWht };
  }, [bills]);

  function handleAddItem() {
    setFormItems([
      ...formItems,
      {
        accountId: defaultExpenseAccount?.id || "",
        description: "",
        quantity: 1,
        unitPrice: 0,
        taxRate: 0,
      },
    ]);
  }

  function handleRemoveItem(index: number) {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  }

  function handleItemChange(index: number, field: string, value: any) {
    const next = [...formItems];
    next[index] = { ...next[index], [field]: value };
    setFormItems(next);
  }

  async function handleRegisterBill(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSupplierId) {
      setRegisterError("Please select a vendor / supplier.");
      return;
    }
    if (formItems.some((it) => !it.accountId || !it.description.trim() || it.unitPrice <= 0)) {
      setRegisterError("All line items must have an account, description, and positive unit price.");
      return;
    }

    setIsSubmitting(true);
    setRegisterError(null);

    const payload: CreateVendorBillInput = {
      supplierId: selectedSupplierId,
      reference,
      billDate,
      dueDate,
      whtRate,
      notes,
      items: formItems.map((it) => ({
        accountId: it.accountId,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        taxRate: Number(it.taxRate) || 0,
      })),
    };

    try {
      const res = await createVendorBill(shopSlug, payload);
      if (!res.success) {
        setRegisterError(res.error || "Failed to create vendor bill");
        setIsSubmitting(false);
        return;
      }

      // Optimistic local state injection
      const selectedSupp = suppliers.find((s) => s.id === selectedSupplierId);
      const newBill: SerializedBill = {
        id: res.billId!,
        billNumber: res.billNumber!,
        reference: reference || null,
        billDate: new Date(billDate).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : null,
        subTotal: formCalculations.subTotal.toFixed(2),
        taxAmount: formCalculations.taxAmount.toFixed(2),
        whtRate: whtRate.toFixed(2),
        whtAmount: formCalculations.whtAmount.toFixed(2),
        totalAmount: formCalculations.grossTotal.toFixed(2),
        netPayable: formCalculations.netPayable.toFixed(2),
        amountPaid: "0.00",
        status: "DRAFT",
        paymentChannel: null,
        paymentReference: null,
        notes: notes || null,
        supplier: {
          id: selectedSupp?.id || "",
          name: selectedSupp?.name || "Vendor",
          email: selectedSupp?.email || "",
          phone: null,
          taxPin: selectedSupp?.taxPin || null,
        },
        items: formItems.map((it, idx) => {
          const acc = accounts.find((a) => a.id === it.accountId);
          const lineSub = it.quantity * it.unitPrice;
          const lineTot = lineSub * (1 + it.taxRate / 100);
          return {
            id: `temp-${idx}`,
            description: it.description,
            quantity: it.quantity.toFixed(2),
            unitPrice: it.unitPrice.toFixed(2),
            taxRate: it.taxRate.toFixed(2),
            totalAmount: lineTot.toFixed(2),
            account: acc ? { id: acc.id, code: acc.code, name: acc.name } : null,
          };
        }),
      };

      setBills([newBill, ...bills]);
      setIsRegisterOpen(false);
      // Reset form
      setReference("");
      setNotes("");
      setWhtRate(0);
      setFormItems([
        {
          accountId: defaultExpenseAccount?.id || "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
        },
      ]);
    } catch (err: any) {
      setRegisterError(err.message || "Failed to create vendor bill");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleApprove(bill: SerializedBill) {
    if (!confirm(`Approve Bill ${bill.billNumber} for ${bill.supplier.name}?\n\nThis will post the liability to General Ledger Account 2100 (Accounts Payable).`)) {
      return;
    }

    try {
      const res = await approveVendorBill(bill.id, shopSlug);
      if (!res.success) {
        alert(res.error || "Approval failed");
        return;
      }
      setBills(
        bills.map((b) => (b.id === bill.id ? { ...b, status: "APPROVED" } : b))
      );
    } catch (err: any) {
      alert(err.message || "Approval failed");
    }
  }

  function openPaymentModal(bill: SerializedBill) {
    const net = parseFloat(bill.netPayable || "0");
    const paid = parseFloat(bill.amountPaid || "0");
    const remaining = Math.max(0, net - paid);
    setPayingBill(bill);
    setPaymentAmount(remaining.toFixed(2));
    setPaymentChannel("BANK");
    setPaymentReference("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentError(null);
  }

  async function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (!payingBill) return;

    const amt = parseFloat(paymentAmount);
    if (!amt || amt <= 0) {
      setPaymentError("Please enter a positive payment amount");
      return;
    }

    setIsPaying(true);
    setPaymentError(null);

    const payload: PayVendorBillInput = {
      paymentAmount: amt,
      paymentChannel,
      paymentReference,
      paymentDate,
    };

    try {
      const res = await payVendorBill(payingBill.id, shopSlug, payload);
      if (!res.success) {
        setPaymentError(res.error || "Payment recording failed");
        setIsPaying(false);
        return;
      }

      setBills(
        bills.map((b) => {
          if (b.id === payingBill.id) {
            const currentPaid = parseFloat(b.amountPaid || "0");
            const nextPaid = currentPaid + amt;
            return {
              ...b,
              amountPaid: nextPaid.toFixed(2),
              status: res.newStatus || (nextPaid >= parseFloat(b.netPayable) - 0.01 ? "PAID" : "PARTIALLY_PAID"),
              paymentChannel,
              paymentReference,
            };
          }
          return b;
        })
      );
      setPayingBill(null);
    } catch (err: any) {
      setPaymentError(err.message || "Payment recording failed");
    } finally {
      setIsPaying(false);
    }
  }

  async function handleCancel(bill: SerializedBill) {
    if (!confirm(`Void/Cancel Bill ${bill.billNumber}?`)) return;
    try {
      const res = await cancelVendorBill(bill.id, shopSlug);
      if (!res.success) {
        alert(res.error || "Cancellation failed");
        return;
      }
      setBills(
        bills.map((b) => (b.id === bill.id ? { ...b, status: "CANCELLED" } : b))
      );
    } catch (err: any) {
      alert(err.message || "Cancellation failed");
    }
  }

  async function handleDeleteDraft(bill: SerializedBill) {
    if (!confirm(`Permanently delete draft bill ${bill.billNumber}?`)) return;
    try {
      const res = await deleteVendorBill(bill.id, shopSlug);
      if (!res.success) {
        alert(res.error || "Delete failed");
        return;
      }
      setBills(bills.filter((b) => b.id !== bill.id));
    } catch (err: any) {
      alert(err.message || "Delete failed");
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. METRICS BANNER */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Total Outstanding</p>
          <p className="text-xl font-bold text-zinc-900 mt-1">
            {formatCurrency(metrics.totalOutstanding, currency)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Approved & unpaid vendor liability</p>
        </div>

        <div className="surface p-4 rounded-xl border border-rose-100 bg-rose-50/40">
          <p className="text-[11px] font-mono uppercase tracking-wider text-rose-600 font-semibold">Overdue Payables</p>
          <p className="text-xl font-bold text-rose-700 mt-1">
            {formatCurrency(metrics.overdueAmt, currency)}
          </p>
          <p className="text-[11px] text-rose-600/80 mt-1">Passed agreed payment terms</p>
        </div>

        <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Pending Approvals</p>
          <p className="text-xl font-bold text-zinc-900 mt-1">
            {metrics.pendingApprovalCount} <span className="text-xs font-normal text-zinc-400">bills</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Drafts awaiting controller sign-off</p>
        </div>

        <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">WHT Deductions</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">
            {formatCurrency(metrics.totalWht, currency)}
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Accrued statutory WHT liability</p>
        </div>
      </div>

      {/* 2. ACTIONS & FILTERS HEADER */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search by Bill #, Reference, or Supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-black"
          />
          <span className="absolute left-3 top-2.5 text-zinc-400 text-xs">🔍</span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href={`/workspaces/${shopSlug}/finance/reports/payables-aging`}
            className="px-3.5 py-2 text-xs font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span>📊</span>
            <span>Payables Aging</span>
          </Link>
          <button
            onClick={() => setIsRegisterOpen(true)}
            className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Register Vendor Bill</span>
          </button>
        </div>
      </div>

      {/* 3. STATUS TABS */}
      <div className="flex border-b border-zinc-200 gap-2 overflow-x-auto text-xs">
        {["ALL", "DRAFT", "APPROVED", "PARTIALLY_PAID", "PAID", "CANCELLED"].map((status) => {
          const count = status === "ALL" ? bills.length : bills.filter((b) => b.status === status).length;
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3.5 py-2.5 font-medium border-b-2 transition-colors whitespace-nowrap ${
                isActive
                  ? "border-black text-black font-semibold"
                  : "border-transparent text-zinc-500 hover:text-zinc-900"
              }`}
            >
              {status.replace("_", " ")} ({count})
            </button>
          );
        })}
      </div>

      {/* 4. BILLS TABLE */}
      <div className="surface overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-50/70">
              <th className="px-4 py-3 border-r border-zinc-100">Bill No / Ref</th>
              <th className="px-4 py-3 border-r border-zinc-100">Vendor / Supplier</th>
              <th className="px-4 py-3 border-r border-zinc-100">Bill Date</th>
              <th className="px-4 py-3 border-r border-zinc-100">Due Date</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-right">Gross Total</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-right">WHT</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-right">Net Payable</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-right">Balance Due</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBills.map((b) => {
              const net = parseFloat(b.netPayable || "0");
              const paid = parseFloat(b.amountPaid || "0");
              const balance = Math.max(0, net - paid);
              const isOverdue = b.dueDate && new Date(b.dueDate) < new Date() && balance > 0.01;

              return (
                <tr key={b.id} className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0">
                  <td className="p-4 border-r border-zinc-100">
                    <span className="font-semibold text-zinc-900 block">{b.billNumber}</span>
                    {b.reference && (
                      <span className="text-[10px] text-zinc-400 font-mono">Ref: {b.reference}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 font-sans">
                    <span className="font-semibold text-zinc-900 block">{b.supplier.name}</span>
                    {b.supplier.taxPin && (
                      <span className="text-[10px] font-mono text-zinc-400">PIN: {b.supplier.taxPin}</span>
                    )}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 text-zinc-600">
                    {new Date(b.billDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100">
                    {b.dueDate ? (
                      <span className={isOverdue ? "text-rose-600 font-bold" : "text-zinc-600"}>
                        {new Date(b.dueDate).toLocaleDateString("en-KE", { dateStyle: "medium" })}
                        {isOverdue && " ⚠️ Overdue"}
                      </span>
                    ) : (
                      <span className="text-zinc-400">Immediate</span>
                    )}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 text-right font-medium text-zinc-700">
                    {formatCurrency(b.totalAmount, currency)}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 text-right text-zinc-500">
                    {parseFloat(b.whtAmount) > 0 ? (
                      <span className="text-amber-700 font-semibold">
                        -{formatCurrency(b.whtAmount, currency)} ({parseFloat(b.whtRate)}%)
                      </span>
                    ) : (
                      "0.00"
                    )}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 text-right font-bold text-zinc-900">
                    {formatCurrency(b.netPayable, currency)}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 text-right font-bold">
                    <span className={balance > 0.01 ? (isOverdue ? "text-rose-600" : "text-amber-700") : "text-zinc-400"}>
                      {formatCurrency(balance, currency)}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-center">
                    <span
                      className={`border px-2 py-0.5 text-[9px] font-semibold tracking-wider uppercase rounded ${
                        b.status === "PAID"
                          ? "badge-emerald"
                          : b.status === "APPROVED"
                          ? "badge-indigo"
                          : b.status === "PARTIALLY_PAID"
                          ? "badge-amber"
                          : b.status === "CANCELLED"
                          ? "badge-rose"
                          : "badge-zinc"
                      }`}
                    >
                      {b.status}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5 font-sans text-xs">
                      {b.status === "DRAFT" && (
                        <>
                          <button
                            onClick={() => handleApprove(b)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded border border-indigo-200 transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleDeleteDraft(b)}
                            className="px-2 py-1 text-[11px] text-zinc-400 hover:text-rose-600 rounded transition-colors"
                            title="Delete Draft"
                          >
                            🗑️
                          </button>
                        </>
                      )}

                      {(b.status === "APPROVED" || b.status === "PARTIALLY_PAID") && (
                        <>
                          <button
                            onClick={() => openPaymentModal(b)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200 transition-colors"
                          >
                            Pay Bill
                          </button>
                          <button
                            onClick={() => setVoucherBill(b)}
                            className="px-2.5 py-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                            title="Print Remittance Voucher"
                          >
                            Voucher
                          </button>
                        </>
                      )}

                      {b.status === "PAID" && (
                        <button
                          onClick={() => setVoucherBill(b)}
                          className="px-2.5 py-1 text-[11px] font-medium text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors"
                        >
                          Voucher
                        </button>
                      )}

                      {b.status !== "CANCELLED" && b.status !== "PAID" && (
                        <button
                          onClick={() => handleCancel(b)}
                          className="px-2 py-1 text-[11px] text-zinc-400 hover:text-rose-600 transition-colors"
                          title="Void / Cancel"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredBills.length === 0 && (
              <tr>
                <td colSpan={10} className="p-16 text-center">
                  <div className="space-y-3">
                    <p className="font-bold text-zinc-800 text-sm font-sans">No vendor bills found</p>
                    <p className="text-zinc-400 text-xs font-sans max-w-sm mx-auto">
                      Record an inbound supplier invoice to track Accounts Payable, Withholding Tax, and payment runs.
                    </p>
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider inline-block mt-2"
                    >
                      + Register Vendor Bill
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 5. REGISTER VENDOR BILL MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-zinc-200 shadow-2xl p-6 sm:p-7 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Register Inbound Vendor Bill</h3>
                <p className="text-xs text-zinc-500">Record a supplier bill with line-item GL expense allocation and WHT.</p>
              </div>
              <button
                onClick={() => setIsRegisterOpen(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {registerError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {registerError}
              </div>
            )}

            <form onSubmit={handleRegisterBill} className="space-y-5">
              {/* Supplier & Ref */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Vendor / Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => setSelectedSupplierId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white font-sans focus:outline-none focus:ring-1 focus:ring-black"
                    required
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.taxPin ? `(PIN: ${s.taxPin})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Vendor Invoice / Reference No.
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-9481 or BNK-OCT"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Dates & WHT */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Bill Date</label>
                  <input
                    type="date"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-black"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Due Date</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Withholding Tax (WHT)
                  </label>
                  <select
                    value={whtRate}
                    onChange={(e) => setWhtRate(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white font-sans focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value={0}>0% — Standard (No WHT)</option>
                    <option value={5}>5% — Professional / Legal / Mgmt</option>
                    <option value={10}>10% — Rent / Immovable Property</option>
                    <option value={3}>3% — Building & Civil Works</option>
                    <option value={15}>15% — Non-Resident / Royalty</option>
                  </select>
                </div>
              </div>

              {/* Line Items Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">
                    Expense Line Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-black font-semibold hover:underline"
                  >
                    + Add Line Item
                  </button>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 p-3 bg-zinc-50 border border-zinc-200/80 rounded-xl items-center text-xs"
                    >
                      <div className="col-span-4">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">GL Account</label>
                        <select
                          value={item.accountId}
                          onChange={(e) => handleItemChange(idx, "accountId", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 bg-white"
                          required
                        >
                          {accounts.map((acc) => (
                            <option key={acc.id} value={acc.id}>
                              {acc.code} - {acc.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-span-4">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">Description</label>
                        <input
                          type="text"
                          placeholder="e.g. Legal retainers for Sept"
                          value={item.description}
                          onChange={(e) => handleItemChange(idx, "description", e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 bg-white"
                          required
                        />
                      </div>

                      <div className="col-span-1">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">Qty</label>
                        <input
                          type="number"
                          step="any"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 bg-white text-right font-mono"
                          required
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[10px] text-zinc-400 mb-0.5">Unit Price</label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                          className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 bg-white text-right font-mono"
                          required
                        />
                      </div>

                      <div className="col-span-1 flex items-end justify-center pt-3">
                        {formItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-zinc-400 hover:text-rose-600 text-sm"
                            title="Remove row"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Financial Calculation Summary */}
              <div className="p-4 bg-zinc-900 text-white rounded-xl space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-zinc-400">
                  <span>Gross Subtotal:</span>
                  <span>{formatCurrency(formCalculations.subTotal, currency)}</span>
                </div>
                {formCalculations.taxAmount > 0 && (
                  <div className="flex justify-between text-zinc-400">
                    <span>VAT (16%):</span>
                    <span>{formatCurrency(formCalculations.taxAmount, currency)}</span>
                  </div>
                )}
                {formCalculations.whtAmount > 0 && (
                  <div className="flex justify-between text-amber-400 font-semibold">
                    <span>Less WHT ({whtRate}%):</span>
                    <span>-{formatCurrency(formCalculations.whtAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-zinc-800 text-white">
                  <span>Net Payable to Vendor:</span>
                  <span className="text-emerald-400">{formatCurrency(formCalculations.netPayable, currency)}</span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Notes / Terms</label>
                <textarea
                  rows={2}
                  placeholder="Additional delivery instructions or payment terms..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white"
                />
              </div>

              {/* Submit / Cancel */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setIsRegisterOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary-modern px-5 py-2 text-xs font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {isSubmitting ? "Registering..." : "Save Vendor Bill"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. PAYMENT RECORDING MODAL */}
      {payingBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Record Vendor Bill Payment</h3>
                <p className="text-xs text-zinc-500">Bill: {payingBill.billNumber} ({payingBill.supplier.name})</p>
              </div>
              <button onClick={() => setPayingBill(null)} className="text-zinc-400 hover:text-zinc-600">✕</button>
            </div>

            {paymentError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg font-medium">
                {paymentError}
              </div>
            )}

            <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Payment Amount ({currency})</label>
                <input
                  type="number"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold font-mono rounded-lg border border-zinc-200 bg-white"
                  required
                />
                <p className="text-[10px] text-zinc-400 mt-1">
                  Net Balance Due: {formatCurrency(Math.max(0, parseFloat(payingBill.netPayable) - parseFloat(payingBill.amountPaid)), currency)}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Payment Channel</label>
                <select
                  value={paymentChannel}
                  onChange={(e) => setPaymentChannel(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-zinc-200 bg-white"
                >
                  <option value="BANK">Bank Transfer / EFT</option>
                  <option value="MPESA">M-Pesa Business / B2B Payout</option>
                  <option value="CHEQUE">Corporate Cheque</option>
                  <option value="CASH">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Transaction Reference No.</label>
                <input
                  type="text"
                  placeholder="e.g. M-Pesa Code QAB9981 or EFT FT26190"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-lg border border-zinc-200 bg-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-zinc-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 font-mono rounded-lg border border-zinc-200 bg-white"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
                <button
                  type="button"
                  onClick={() => setPayingBill(null)}
                  className="px-4 py-2 font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPaying}
                  className="btn-primary-modern px-5 py-2 font-semibold uppercase tracking-wider disabled:opacity-50"
                >
                  {isPaying ? "Recording..." : "Confirm Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. PRINTABLE REMITTANCE ADVICE MODAL */}
      {voucherBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-zinc-200 shadow-2xl p-7 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Payment Voucher & Remittance Advice</h3>
                <p className="text-xs text-zinc-500">Official proof of settlement for vendor files and statutory audit.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg flex items-center gap-1.5"
                >
                  <span>🖨️</span>
                  <span>Print Voucher</span>
                </button>
                <button
                  onClick={() => setVoucherBill(null)}
                  className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Voucher printable body */}
            <div className="border border-zinc-300 p-6 rounded-xl space-y-5 text-zinc-900 font-sans text-xs">
              <div className="flex justify-between items-start border-b border-zinc-200 pb-4">
                <div>
                  <h2 className="text-base font-bold uppercase tracking-wider">{shopName}</h2>
                  <p className="text-zinc-500 font-mono text-[11px]">VOUCHER NO: PV-{voucherBill.billNumber}</p>
                  <p className="text-zinc-500 text-[11px]">DATE: {new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-zinc-100 text-zinc-800 font-mono text-xs font-bold rounded">
                    REMITTANCE ADVICE
                  </span>
                </div>
              </div>

              {/* Payee Details */}
              <div className="grid grid-cols-2 gap-4 bg-zinc-50 p-3 rounded-lg">
                <div>
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Payee / Vendor</p>
                  <p className="font-bold text-sm text-zinc-900">{voucherBill.supplier.name}</p>
                  <p className="text-zinc-600">{voucherBill.supplier.email}</p>
                  {voucherBill.supplier.taxPin && (
                    <p className="font-mono text-zinc-600">PIN: {voucherBill.supplier.taxPin}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase font-bold text-zinc-400">Settlement Info</p>
                  <p className="font-semibold text-zinc-900">
                    Channel: {voucherBill.paymentChannel || "BANK EFT"}
                  </p>
                  <p className="font-mono text-zinc-600">
                    Ref: {voucherBill.paymentReference || "DIRECT"}
                  </p>
                </div>
              </div>

              {/* Breakdown */}
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="py-1.5">Description</th>
                    <th className="py-1.5 text-center">Account</th>
                    <th className="py-1.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {voucherBill.items.map((it, i) => (
                    <tr key={i}>
                      <td className="py-2">{it.description}</td>
                      <td className="py-2 text-center text-zinc-500">{it.account?.code || "AP"}</td>
                      <td className="py-2 text-right">{formatCurrency(it.totalAmount, currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-zinc-200 pt-3 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span>Gross Bill Total:</span>
                  <span>{formatCurrency(voucherBill.totalAmount, currency)}</span>
                </div>
                {parseFloat(voucherBill.whtAmount) > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Withholding Tax Withheld ({parseFloat(voucherBill.whtRate)}%):</span>
                    <span>-{formatCurrency(voucherBill.whtAmount, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-zinc-900 pt-1 border-t border-zinc-100">
                  <span>Total Amount Paid / Disbursed:</span>
                  <span>{formatCurrency(voucherBill.amountPaid, currency)}</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-zinc-200 text-[10px] text-zinc-500 uppercase">
                <div>
                  <p className="border-b border-zinc-300 pb-8">Prepared By</p>
                  <p className="mt-1">Accounts Officer</p>
                </div>
                <div>
                  <p className="border-b border-zinc-300 pb-8">Verified By</p>
                  <p className="mt-1">Internal Auditor</p>
                </div>
                <div>
                  <p className="border-b border-zinc-300 pb-8">Approved By</p>
                  <p className="mt-1">Finance Director</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
