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
  updateVendorBillAttachment,
  type CreateVendorBillInput,
  type PayVendorBillInput,
} from "@/lib/actions/bills";
import ReceiptAttachmentUploader from "@/components/ReceiptAttachmentUploader";
import toast from "react-hot-toast";

export interface SerializedBillItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxRate: string;
  totalAmount: string;
  poItemId?: string | null;
  poUnitPrice?: string | null;
  grnQuantity?: string | null;
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
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  notes: string | null;
  sourcePoId?: string | null;
  sourceGrnId?: string | null;
  matchingStatus: string;
  priceVarianceAmount: string;
  quantityVarianceCount: number;
  varianceNotes?: string | null;
  sourcePo?: {
    id: string;
    docNumber: string;
    issueDate: string;
    grandTotal: string;
  } | null;
  sourceGrn?: {
    id: string;
    docNumber: string;
    issueDate: string;
  } | null;
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

export interface AvailableDocItem {
  id: string;
  description: string;
  quantity: string;
  unitPrice: string;
  taxType: string;
}

export interface AvailablePo {
  id: string;
  docNumber: string;
  type: string;
  supplierId: string | null;
  issueDate: string;
  grandTotal: string;
  items: AvailableDocItem[];
}

export interface AvailableGrn {
  id: string;
  docNumber: string;
  type: string;
  supplierId: string | null;
  issueDate: string;
  items: AvailableDocItem[];
}

interface VendorBillsClientProps {
  shopSlug: string;
  shopName: string;
  currency: string;
  isGlEnabled: boolean;
  initialBills: SerializedBill[];
  suppliers: SerializedSupplier[];
  accounts: SerializedAccount[];
  availablePos?: AvailablePo[];
  availableGrns?: AvailableGrn[];
}

export function VendorBillsClient({
  shopSlug,
  shopName,
  currency,
  isGlEnabled,
  initialBills,
  suppliers,
  accounts,
  availablePos = [],
  availableGrns = [],
}: VendorBillsClientProps) {
  const [bills, setBills] = useState<SerializedBill[]>(initialBills);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [matchingFilter, setMatchingFilter] = useState("ALL");

  // Registration Modal State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);

  // 3-Way Matching Form Selection
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || "");
  const [selectedPoId, setSelectedPoId] = useState("");
  const [selectedGrnId, setSelectedGrnId] = useState("");
  const [reference, setReference] = useState("");
  const [billDate, setBillDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  });
  const [whtRate, setWhtRate] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [varianceJustification, setVarianceJustification] = useState("");
  const [allowVarianceOverride, setAllowVarianceOverride] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string>("");
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [attachmentSize, setAttachmentSize] = useState<number | undefined>(undefined);

  const defaultExpenseAccount = accounts.find((a) => a.code === "6900" || a.accountType === "EXPENSE") || accounts[0];

  const [formItems, setFormItems] = useState([
    {
      accountId: defaultExpenseAccount?.id || "",
      description: "",
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      poItemId: "" as string | undefined,
      poUnitPrice: undefined as number | undefined,
      grnQuantity: undefined as number | undefined,
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

  // 3-Way Matching Inspection Modal State
  const [inspectingBill, setInspectingBill] = useState<SerializedBill | null>(null);

  // Variance Approval Override Modal State
  const [overrideBill, setOverrideBill] = useState<SerializedBill | null>(null);
  const [overrideNotesInput, setOverrideNotesInput] = useState("");
  const [isApprovingOverride, setIsApprovingOverride] = useState(false);

  // Filtered available POs and GRNs for current selected supplier
  const supplierPos = useMemo(() => {
    if (!selectedSupplierId) return availablePos;
    return availablePos.filter((p) => p.supplierId === selectedSupplierId);
  }, [availablePos, selectedSupplierId]);

  const supplierGrns = useMemo(() => {
    if (!selectedSupplierId) return availableGrns;
    return availableGrns.filter((g) => g.supplierId === selectedSupplierId);
  }, [availableGrns, selectedSupplierId]);

  // Auto-fill from PO selection
  function handleSelectPo(poId: string) {
    setSelectedPoId(poId);
    if (!poId) return;

    const po = availablePos.find((p) => p.id === poId);
    if (!po) return;

    if (!reference) {
      setReference(`PO #${po.docNumber}`);
    }

    if (po.items && po.items.length > 0) {
      // Find matching GRN items if GRN selected
      const grn = availableGrns.find((g) => g.id === selectedGrnId);

      const itemsFromPo = po.items.map((it) => {
        const matchingGrnItem = grn?.items?.find((gi) => gi.description.toLowerCase() === it.description.toLowerCase());
        const grnQty = matchingGrnItem ? parseFloat(matchingGrnItem.quantity) : parseFloat(it.quantity);
        const poPrice = parseFloat(it.unitPrice);
        const poQty = parseFloat(it.quantity);
        const taxRate = it.taxType === "V_16" ? 16 : 0;

        return {
          accountId: defaultExpenseAccount?.id || "",
          description: it.description,
          quantity: poQty,
          unitPrice: poPrice,
          taxRate,
          poItemId: it.id,
          poUnitPrice: poPrice,
          grnQuantity: grnQty,
        };
      });

      setFormItems(itemsFromPo);
    }
  }

  // Handle GRN selection
  function handleSelectGrn(grnId: string) {
    setSelectedGrnId(grnId);
    if (!grnId) return;

    const grn = availableGrns.find((g) => g.id === grnId);
    if (!grn) return;

    // Update existing items with GRN received quantities
    setFormItems((prev) =>
      prev.map((item) => {
        const matching = grn.items?.find((gi) => gi.description.toLowerCase() === item.description.toLowerCase());
        if (matching) {
          return {
            ...item,
            grnQuantity: parseFloat(matching.quantity),
          };
        }
        return item;
      })
    );
  }

  // Computed Form Metrics & Real-time 3-Way Match Verification
  const formCalculations = useMemo(() => {
    let sub = 0;
    let tax = 0;
    let priceVariance = 0;
    let qtyVarianceCount = 0;
    let hasPriceVariance = false;
    let hasQtyVariance = false;

    formItems.forEach((it) => {
      const lineSub = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      const lineTax = lineSub * ((Number(it.taxRate) || 0) / 100);
      sub += lineSub;
      tax += lineTax;

      if (it.poUnitPrice !== undefined && it.poUnitPrice !== null) {
        const diffPrice = it.unitPrice - it.poUnitPrice;
        if (diffPrice > 0.01) {
          hasPriceVariance = true;
          priceVariance += diffPrice * it.quantity;
        }
      }

      if (it.grnQuantity !== undefined && it.grnQuantity !== null) {
        const diffQty = it.quantity - it.grnQuantity;
        if (diffQty > 0.01) {
          hasQtyVariance = true;
          qtyVarianceCount += 1;
        }
      }
    });

    const gross = sub + tax;
    const wht = sub * (whtRate / 100);
    const net = Math.max(0, gross - wht);

    let matchPreview: "PERFECT_MATCH" | "PRICE_VARIANCE" | "QUANTITY_VARIANCE" | "PRICE_AND_QTY_VARIANCE" | "UNMATCHED" = "UNMATCHED";
    if (selectedPoId || selectedGrnId) {
      if (hasPriceVariance && hasQtyVariance) {
        matchPreview = "PRICE_AND_QTY_VARIANCE";
      } else if (hasPriceVariance) {
        matchPreview = "PRICE_VARIANCE";
      } else if (hasQtyVariance) {
        matchPreview = "QUANTITY_VARIANCE";
      } else {
        matchPreview = "PERFECT_MATCH";
      }
    }

    return {
      subTotal: sub,
      taxAmount: tax,
      grossTotal: gross,
      whtAmount: wht,
      netPayable: net,
      priceVariance,
      qtyVarianceCount,
      matchPreview,
    };
  }, [formItems, whtRate, selectedPoId, selectedGrnId]);

  // Filtered Bills
  const filteredBills = useMemo(() => {
    return bills.filter((b) => {
      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
      let matchesMatching = true;
      if (matchingFilter === "PERFECT_MATCH") {
        matchesMatching = b.matchingStatus === "PERFECT_MATCH";
      } else if (matchingFilter === "VARIANCE") {
        matchesMatching = ["PRICE_VARIANCE", "QUANTITY_VARIANCE", "PRICE_AND_QTY_VARIANCE"].includes(b.matchingStatus);
      } else if (matchingFilter === "OVERRIDE") {
        matchesMatching = b.matchingStatus === "MANUAL_OVERRIDE";
      } else if (matchingFilter === "UNMATCHED") {
        matchesMatching = b.matchingStatus === "UNMATCHED" || !b.matchingStatus;
      }

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.billNumber.toLowerCase().includes(q) ||
        (b.reference && b.reference.toLowerCase().includes(q)) ||
        b.supplier.name.toLowerCase().includes(q) ||
        (b.supplier.taxPin && b.supplier.taxPin.toLowerCase().includes(q));

      return matchesStatus && matchesMatching && matchesSearch;
    });
  }, [bills, statusFilter, matchingFilter, search]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let totalOutstanding = 0;
    let overdueAmt = 0;
    let pendingApprovalCount = 0;
    let varianceCount = 0;
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

      if (["PRICE_VARIANCE", "QUANTITY_VARIANCE", "PRICE_AND_QTY_VARIANCE"].includes(b.matchingStatus)) {
        varianceCount += 1;
      }
    });

    return { totalOutstanding, overdueAmt, pendingApprovalCount, varianceCount };
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
        poItemId: undefined,
        poUnitPrice: undefined,
        grnQuantity: undefined,
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
      sourcePoId: selectedPoId || undefined,
      sourceGrnId: selectedGrnId || undefined,
      varianceNotes: varianceJustification || undefined,
      allowVarianceOverride,
      attachmentUrl: attachmentUrl.trim() || undefined,
      attachmentName: attachmentName.trim() || undefined,
      attachmentSize,
      items: formItems.map((it) => ({
        accountId: it.accountId,
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        taxRate: Number(it.taxRate) || 0,
        poItemId: it.poItemId,
        poUnitPrice: it.poUnitPrice,
        grnQuantity: it.grnQuantity,
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
      const selectedPo = availablePos.find((p) => p.id === selectedPoId);
      const selectedGrn = availableGrns.find((g) => g.id === selectedGrnId);

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
        attachmentUrl: attachmentUrl.trim() || null,
        attachmentName: attachmentName.trim() || null,
        attachmentSize: attachmentSize || null,
        notes: notes || null,
        sourcePoId: selectedPoId || null,
        sourceGrnId: selectedGrnId || null,
        matchingStatus: res.matchingStatus || formCalculations.matchPreview,
        priceVarianceAmount: formCalculations.priceVariance.toFixed(2),
        quantityVarianceCount: formCalculations.qtyVarianceCount,
        varianceNotes: varianceJustification || null,
        sourcePo: selectedPo
          ? {
              id: selectedPo.id,
              docNumber: selectedPo.docNumber,
              issueDate: selectedPo.issueDate,
              grandTotal: selectedPo.grandTotal,
            }
          : null,
        sourceGrn: selectedGrn
          ? {
              id: selectedGrn.id,
              docNumber: selectedGrn.docNumber,
              issueDate: selectedGrn.issueDate,
            }
          : null,
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
            poItemId: it.poItemId || null,
            poUnitPrice: it.poUnitPrice !== undefined ? it.poUnitPrice.toFixed(2) : null,
            grnQuantity: it.grnQuantity !== undefined ? it.grnQuantity.toFixed(2) : null,
            account: acc ? { id: acc.id, code: acc.code, name: acc.name } : null,
          };
        }),
      };

      setBills([newBill, ...bills]);
      setIsRegisterOpen(false);

      // Reset form
      setSelectedPoId("");
      setSelectedGrnId("");
      setReference("");
      setNotes("");
      setVarianceJustification("");
      setAllowVarianceOverride(false);
      setAttachmentUrl("");
      setAttachmentName("");
      setAttachmentSize(undefined);
      setWhtRate(0);
      setFormItems([
        {
          accountId: defaultExpenseAccount?.id || "",
          description: "",
          quantity: 1,
          unitPrice: 0,
          taxRate: 0,
          poItemId: undefined,
          poUnitPrice: undefined,
          grnQuantity: undefined,
        },
      ]);
    } catch (err: any) {
      setRegisterError(err.message || "Failed to create vendor bill");
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleStartApprove(bill: SerializedBill) {
    const hasVariance = ["PRICE_VARIANCE", "QUANTITY_VARIANCE", "PRICE_AND_QTY_VARIANCE"].includes(bill.matchingStatus);
    if (hasVariance) {
      setOverrideBill(bill);
      setOverrideNotesInput("");
    } else {
      executeStandardApprove(bill);
    }
  }

  async function executeStandardApprove(bill: SerializedBill) {
    if (
      !confirm(
        `Approve Bill ${bill.billNumber} for ${bill.supplier.name}?\n\nThis will post the liability to General Ledger Account 2100 (Accounts Payable).`
      )
    ) {
      return;
    }

    try {
      const res = await approveVendorBill(bill.id, shopSlug);
      if (!res.success) {
        alert(res.error || "Approval failed");
        return;
      }
      setBills(bills.map((b) => (b.id === bill.id ? { ...b, status: "APPROVED" } : b)));
    } catch (err: any) {
      alert(err.message || "Approval failed");
    }
  }

  async function handleConfirmOverrideApprove() {
    if (!overrideBill) return;
    if (!overrideNotesInput.trim()) {
      alert("Please enter a justification for overriding the 3-way matching variance.");
      return;
    }

    setIsApprovingOverride(true);
    try {
      const res = await approveVendorBill(overrideBill.id, shopSlug, {
        allowVarianceOverride: true,
        overrideNotes: overrideNotesInput.trim(),
      });
      if (!res.success) {
        alert(res.error || "Override approval failed");
        return;
      }
      setBills(
        bills.map((b) =>
          b.id === overrideBill.id
            ? {
                ...b,
                status: "APPROVED",
                matchingStatus: "MANUAL_OVERRIDE",
                varianceNotes: `${b.varianceNotes ? b.varianceNotes + " | " : ""}Approved with override: ${overrideNotesInput.trim()}`,
              }
            : b
        )
      );
      setOverrideBill(null);
    } catch (err: any) {
      alert(err.message || "Override approval failed");
    } finally {
      setIsApprovingOverride(false);
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
      setBills(bills.map((b) => (b.id === bill.id ? { ...b, status: "CANCELLED" } : b)));
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
          <p className="text-xl font-bold text-zinc-900 mt-1">{formatCurrency(metrics.totalOutstanding, currency)}</p>
          <p className="text-[11px] text-zinc-500 mt-1">Approved & unpaid vendor liability</p>
        </div>

        <div className="surface p-4 rounded-xl border border-rose-100 bg-rose-50/40">
          <p className="text-[11px] font-mono uppercase tracking-wider text-rose-600 font-semibold">Overdue Payables</p>
          <p className="text-xl font-bold text-rose-700 mt-1">{formatCurrency(metrics.overdueAmt, currency)}</p>
          <p className="text-[11px] text-rose-600/80 mt-1">Passed agreed payment terms</p>
        </div>

        <div className="surface p-4 rounded-xl border border-zinc-200/80 bg-white">
          <p className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Pending Approvals</p>
          <p className="text-xl font-bold text-zinc-900 mt-1">
            {metrics.pendingApprovalCount} <span className="text-xs font-normal text-zinc-400">bills</span>
          </p>
          <p className="text-[11px] text-zinc-500 mt-1">Drafts awaiting controller sign-off</p>
        </div>

        <div className="surface p-4 rounded-xl border border-amber-200 bg-amber-50/50">
          <p className="text-[11px] font-mono uppercase tracking-wider text-amber-800 font-semibold">3-Way Match Variances</p>
          <p className="text-xl font-bold text-amber-900 mt-1">
            {metrics.varianceCount} <span className="text-xs font-normal text-amber-700">flagged</span>
          </p>
          <p className="text-[11px] text-amber-700/90 mt-1">PO / GRN price or quantity gaps</p>
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
            onClick={() => {
              setIsRegisterOpen(true);
              if (supplierPos.length > 0) {
                handleSelectPo(supplierPos[0].id);
              }
            }}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
          >
            <span>🔗</span>
            <span>Match from PO/GRN</span>
          </button>
          <button
            onClick={() => {
              setSelectedPoId("");
              setSelectedGrnId("");
              setIsRegisterOpen(true);
            }}
            className="btn-primary-modern px-4 py-2 text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5"
          >
            <span>+</span>
            <span>Register Vendor Bill</span>
          </button>
        </div>
      </div>

      {/* 3. STATUS & 3-WAY MATCHING TABS */}
      <div className="flex flex-wrap items-center justify-between border-b border-zinc-200 gap-4 text-xs pb-1">
        <div className="flex gap-2 overflow-x-auto">
          {["ALL", "DRAFT", "APPROVED", "PARTIALLY_PAID", "PAID", "CANCELLED"].map((status) => {
            const count = status === "ALL" ? bills.length : bills.filter((b) => b.status === status).length;
            const isActive = statusFilter === status;
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-2 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive ? "border-black text-black font-semibold" : "border-transparent text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {status.replace("_", " ")} ({count})
              </button>
            );
          })}
        </div>

        {/* 3-Way Match Filter Pills */}
        <div className="flex items-center gap-1.5 pb-1">
          <span className="text-[10px] uppercase font-mono text-zinc-400 mr-1">Match:</span>
          {[
            { id: "ALL", label: "All" },
            { id: "PERFECT_MATCH", label: "🟢 Matched" },
            { id: "VARIANCE", label: "⚠️ Variances" },
            { id: "OVERRIDE", label: "🟣 Overrides" },
            { id: "UNMATCHED", label: "⚪ Direct" },
          ].map((pill) => (
            <button
              key={pill.id}
              onClick={() => setMatchingFilter(pill.id)}
              className={`px-2.5 py-1 text-[11px] rounded-md transition-colors ${
                matchingFilter === pill.id
                  ? "bg-zinc-900 text-white font-medium"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {pill.label}
            </button>
          ))}
        </div>
      </div>

      {/* 4. BILLS TABLE */}
      <div className="surface overflow-x-auto rounded-xl border border-zinc-200 bg-white">
        <table className="w-full text-left font-mono text-xs border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 text-[10px] uppercase tracking-wider text-zinc-400 bg-zinc-50/70">
              <th className="px-4 py-3 border-r border-zinc-100">Bill No / Ref</th>
              <th className="px-4 py-3 border-r border-zinc-100">Vendor / Supplier</th>
              <th className="px-4 py-3 border-r border-zinc-100 text-center">3-Way Match</th>
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
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-semibold text-zinc-900 block">{b.billNumber}</span>
                      {b.attachmentUrl && (
                        <a
                          href={b.attachmentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-700 hover:text-emerald-900 text-xs px-1 hover:bg-emerald-50 rounded no-underline"
                          title={`Attached Invoice: ${b.attachmentName || 'View'}`}
                        >
                          📎
                        </a>
                      )}
                    </div>
                    {b.reference && <span className="text-[10px] text-zinc-400 font-mono">Ref: {b.reference}</span>}
                  </td>

                  <td className="px-4 py-3 border-r border-zinc-100 font-sans">
                    <span className="font-semibold text-zinc-900 block">{b.supplier.name}</span>
                    {b.supplier.taxPin && <span className="text-[10px] font-mono text-zinc-400">PIN: {b.supplier.taxPin}</span>}
                  </td>

                  {/* 3-WAY MATCH BADGE */}
                  <td className="px-3 py-3 border-r border-zinc-100 text-center">
                    {b.matchingStatus === "PERFECT_MATCH" ? (
                      <button
                        onClick={() => setInspectingBill(b)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title="3-Way Match Verified (Exact PO & GRN Match)"
                      >
                        <span>✓</span>
                        <span>Matched</span>
                      </button>
                    ) : b.matchingStatus === "PRICE_VARIANCE" ? (
                      <button
                        onClick={() => setInspectingBill(b)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                        title={`Price Variance: +${formatCurrency(parseFloat(b.priceVarianceAmount), currency)}`}
                      >
                        <span>⚠️</span>
                        <span>Price Var (+{formatCurrency(parseFloat(b.priceVarianceAmount), currency)})</span>
                      </button>
                    ) : b.matchingStatus === "QUANTITY_VARIANCE" ? (
                      <button
                        onClick={() => setInspectingBill(b)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors"
                        title={`Quantity Variance: ${b.quantityVarianceCount} items exceed received qty`}
                      >
                        <span>⚠️</span>
                        <span>Qty Var ({b.quantityVarianceCount})</span>
                      </button>
                    ) : b.matchingStatus === "PRICE_AND_QTY_VARIANCE" ? (
                      <button
                        onClick={() => setInspectingBill(b)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 transition-colors"
                        title="Both Price and Quantity Variances Detected"
                      >
                        <span>🚨</span>
                        <span>Price & Qty Mismatch</span>
                      </button>
                    ) : b.matchingStatus === "MANUAL_OVERRIDE" ? (
                      <button
                        onClick={() => setInspectingBill(b)}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
                        title="Manual Override Approved by Controller"
                      >
                        <span>🛡️</span>
                        <span>Override OK</span>
                      </button>
                    ) : (
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-normal text-zinc-400 bg-zinc-100">
                        Direct Bill
                      </span>
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
                            onClick={() => handleStartApprove(b)}
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
                <td colSpan={11} className="p-16 text-center">
                  <div className="space-y-3">
                    <p className="font-bold text-zinc-800 text-sm font-sans">No vendor bills found</p>
                    <p className="text-zinc-400 text-xs font-sans max-w-sm mx-auto">
                      Record an inbound supplier invoice or match directly against an approved Purchase Order (PO) and Goods
                      Received Note (GRN).
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

      {/* 5. REGISTER VENDOR BILL & 3-WAY MATCH MODAL */}
      {isRegisterOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-zinc-200 shadow-2xl p-6 sm:p-7 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900">Register Inbound Vendor Bill & 3-Way Match</h3>
                <p className="text-xs text-zinc-500">
                  Reconcile supplier invoice against agreed PO line items and actual GRN physical receipts.
                </p>
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
              {/* Supplier & 3-Way Source Documents */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Vendor / Supplier <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedSupplierId}
                    onChange={(e) => {
                      setSelectedSupplierId(e.target.value);
                      setSelectedPoId("");
                      setSelectedGrnId("");
                    }}
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
                    Link Order (PO / LPO / LSO)
                  </label>
                  <select
                    value={selectedPoId}
                    onChange={(e) => handleSelectPo(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">None (Direct Vendor Bill)</option>
                    {supplierPos.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.type === "LSO" ? "🛠️ " : "📦 "} {po.docNumber} ({po.type}) — {formatCurrency(parseFloat(po.grandTotal), currency)}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-400 mt-1">Auto-populates agreed prices & items</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">
                    Link Receipt / Sign-Off (GRN / SCC)
                  </label>
                  <select
                    value={selectedGrnId}
                    onChange={(e) => handleSelectGrn(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="">None (Unverified Quantities / Services)</option>
                    {supplierGrns.map((grn) => (
                      <option key={grn.id} value={grn.id}>
                        {grn.type === "SERVICE_COMPLETION_NOTE" ? "📋 " : "📦 "} {grn.docNumber} ({grn.type === "SERVICE_COMPLETION_NOTE" ? "SCC" : "GRN"})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-zinc-400 mt-1">Verifies dock intake / service sign-off</p>
                </div>
              </div>

              {/* Reference, Dates, and WHT */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Vendor Invoice No. / Ref</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-2026-9481"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

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
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Withholding Tax (WHT)</label>
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

              {/* ATTACH VENDOR INVOICE DOCUMENT (MINIO) */}
              <div className="p-3 bg-zinc-50/80 rounded-xl border border-zinc-200/80">
                <ReceiptAttachmentUploader
                  shopSlug={shopSlug}
                  category="vendor-bills"
                  attachmentUrl={attachmentUrl}
                  attachmentName={attachmentName}
                  attachmentSize={attachmentSize}
                  onUploadSuccess={(data) => {
                    setAttachmentUrl(data.url);
                    setAttachmentName(data.name);
                    setAttachmentSize(data.size);
                  }}
                  onRemove={() => {
                    setAttachmentUrl("");
                    setAttachmentName("");
                    setAttachmentSize(undefined);
                  }}
                  label="Vendor Invoice / Official Bill Scan (MinIO)"
                  helperText="Upload vendor's tax invoice PDF or scan for 3-way audit compliance"
                  compact
                />
              </div>

              {/* 3-Way Match Real-time Status Card */}
              {(selectedPoId || selectedGrnId) && (
                <div
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between ${
                    formCalculations.matchPreview === "PERFECT_MATCH"
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : formCalculations.matchPreview === "PRICE_VARIANCE"
                      ? "bg-amber-50 border-amber-300 text-amber-900"
                      : "bg-rose-50 border-rose-300 text-rose-900"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">
                      {formCalculations.matchPreview === "PERFECT_MATCH" ? "🟢" : "⚠️"}
                    </span>
                    <div>
                      <p className="font-bold">
                        {formCalculations.matchPreview === "PERFECT_MATCH" && "3-Way Match Passed: Perfect Price & Quantity Match"}
                        {formCalculations.matchPreview === "PRICE_VARIANCE" &&
                          `Price Variance Detected: +${formatCurrency(formCalculations.priceVariance, currency)} over PO`}
                        {formCalculations.matchPreview === "QUANTITY_VARIANCE" &&
                          `Quantity Variance Detected: ${formCalculations.qtyVarianceCount} line(s) exceed GRN receipts`}
                        {formCalculations.matchPreview === "PRICE_AND_QTY_VARIANCE" &&
                          "Mismatch: Both unit prices and quantities exceed PO & GRN authorizations"}
                      </p>
                      <p className="text-[11px] opacity-80">
                        {formCalculations.matchPreview === "PERFECT_MATCH"
                          ? "Vendor invoice prices and quantities match authorized purchase orders and receiving logs."
                          : "Variances require explicit controller explanation and override authorization."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Line Items Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-700">Expense Line Items</label>
                  <button type="button" onClick={handleAddItem} className="text-xs text-black font-semibold hover:underline">
                    + Add Line Item
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {formItems.map((item, idx) => {
                    const priceDiff =
                      item.poUnitPrice !== undefined && item.unitPrice > item.poUnitPrice
                        ? item.unitPrice - item.poUnitPrice
                        : 0;
                    const qtyDiff =
                      item.grnQuantity !== undefined && item.quantity > item.grnQuantity
                        ? item.quantity - item.grnQuantity
                        : 0;

                    return (
                      <div
                        key={idx}
                        className={`grid grid-cols-12 gap-2 p-3 rounded-xl items-center text-xs border ${
                          priceDiff > 0 || qtyDiff > 0 ? "bg-amber-50/40 border-amber-200" : "bg-zinc-50 border-zinc-200/80"
                        }`}
                      >
                        <div className="col-span-3">
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

                        <div className="col-span-3">
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

                        <div className="col-span-2">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] text-zinc-400">Qty</label>
                            {item.grnQuantity !== undefined && (
                              <span
                                className={`text-[9px] font-mono ${
                                  qtyDiff > 0 ? "text-rose-600 font-bold" : "text-emerald-700"
                                }`}
                              >
                                GRN: {item.grnQuantity}
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, "quantity", Number(e.target.value))}
                            className={`w-full px-2 py-1.5 text-xs rounded border bg-white text-right font-mono ${
                              qtyDiff > 0 ? "border-rose-400 bg-rose-50" : "border-zinc-200"
                            }`}
                            required
                          />
                        </div>

                        <div className="col-span-2">
                          <div className="flex justify-between items-center mb-0.5">
                            <label className="text-[10px] text-zinc-400">Unit Price</label>
                            {item.poUnitPrice !== undefined && (
                              <span
                                className={`text-[9px] font-mono ${
                                  priceDiff > 0 ? "text-amber-800 font-bold" : "text-emerald-700"
                                }`}
                              >
                                PO: {item.poUnitPrice}
                              </span>
                            )}
                          </div>
                          <input
                            type="number"
                            step="0.01"
                            value={item.unitPrice}
                            onChange={(e) => handleItemChange(idx, "unitPrice", Number(e.target.value))}
                            className={`w-full px-2 py-1.5 text-xs rounded border bg-white text-right font-mono ${
                              priceDiff > 0 ? "border-amber-400 bg-amber-50" : "border-zinc-200"
                            }`}
                            required
                          />
                        </div>

                        <div className="col-span-1 text-right">
                          <label className="block text-[10px] text-zinc-400 mb-0.5">Total</label>
                          <span className="font-mono text-zinc-900 font-bold block py-1.5 text-[11px]">
                            {formatCurrency(item.quantity * item.unitPrice, currency)}
                          </span>
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
                    );
                  })}
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

              {/* Variance Justification if Variance Exists */}
              {formCalculations.matchPreview !== "PERFECT_MATCH" && formCalculations.matchPreview !== "UNMATCHED" && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <label className="block text-xs font-bold text-amber-900">
                    Variance Explanation & Controller Sign-off Justification
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Provide justification for price or quantity variance (e.g., Supplier surcharges approved by MD, emergency expedited shipment)..."
                    value={varianceJustification}
                    onChange={(e) => setVarianceJustification(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-amber-300 bg-white"
                  />
                  <label className="flex items-center gap-2 text-xs text-amber-950 font-medium cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allowVarianceOverride}
                      onChange={(e) => setAllowVarianceOverride(e.target.checked)}
                      className="rounded border-amber-300"
                    />
                    <span>Mark as pre-justified for Manual Controller Override</span>
                  </label>
                </div>
              )}

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

      {/* 6. 3-WAY MATCHING RECONCILIATION AUDIT MODAL */}
      {inspectingBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-zinc-200 shadow-2xl p-6 sm:p-7 my-8 space-y-6">
            <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Reconciliation Audit</span>
                <h3 className="text-lg font-bold text-zinc-900">
                  3-Way Match Verification — {inspectingBill.billNumber}
                </h3>
                <p className="text-xs text-zinc-500">
                  Comparing Purchase Order (PO/LPO) $\longleftrightarrow$ Goods Received Note (GRN) $\longleftrightarrow$
                  Vendor Invoice.
                </p>
              </div>
              <button
                onClick={() => setInspectingBill(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Source Documents Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                <p className="text-[10px] uppercase font-bold text-zinc-400">1. Purchase Order</p>
                <p className="font-bold text-sm text-zinc-900 mt-0.5">
                  {inspectingBill.sourcePo ? inspectingBill.sourcePo.docNumber : "None Linked"}
                </p>
                {inspectingBill.sourcePo && (
                  <p className="text-[11px] text-zinc-500">
                    Grand Total: {formatCurrency(parseFloat(inspectingBill.sourcePo.grandTotal), currency)}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                <p className="text-[10px] uppercase font-bold text-zinc-400">2. Goods Received Note</p>
                <p className="font-bold text-sm text-zinc-900 mt-0.5">
                  {inspectingBill.sourceGrn ? inspectingBill.sourceGrn.docNumber : "None Linked"}
                </p>
                {inspectingBill.sourceGrn && (
                  <p className="text-[11px] text-zinc-500">
                    Received: {new Date(inspectingBill.sourceGrn.issueDate).toLocaleDateString("en-KE")}
                  </p>
                )}
              </div>

              <div className="p-3 rounded-xl border border-zinc-200 bg-zinc-50">
                <p className="text-[10px] uppercase font-bold text-zinc-400">3. Vendor Invoice</p>
                <p className="font-bold text-sm text-zinc-900 mt-0.5">{inspectingBill.billNumber}</p>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Billed Total: {formatCurrency(parseFloat(inspectingBill.totalAmount), currency)}
                </p>
              </div>
            </div>

            {/* Reconciliation Comparison Table */}
            <div className="border border-zinc-200 rounded-xl overflow-hidden">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-200 bg-zinc-100 text-[10px] uppercase tracking-wider text-zinc-600">
                    <th className="p-3">Line Item Description</th>
                    <th className="p-3 text-right">PO Price</th>
                    <th className="p-3 text-right">Billed Price</th>
                    <th className="p-3 text-right">Price Variance</th>
                    <th className="p-3 text-right">GRN Qty</th>
                    <th className="p-3 text-right">Billed Qty</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {inspectingBill.items.map((it, idx) => {
                    const poPrice = it.poUnitPrice ? parseFloat(it.poUnitPrice) : null;
                    const billedPrice = parseFloat(it.unitPrice);
                    const priceDiff = poPrice !== null && billedPrice > poPrice ? billedPrice - poPrice : 0;
                    const grnQty = it.grnQuantity ? parseFloat(it.grnQuantity) : null;
                    const billedQty = parseFloat(it.quantity);
                    const qtyDiff = grnQty !== null && billedQty > grnQty ? billedQty - grnQty : 0;

                    return (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="p-3 font-sans font-medium text-zinc-900">{it.description}</td>
                        <td className="p-3 text-right text-zinc-500">
                          {poPrice !== null ? formatCurrency(poPrice, currency) : "—"}
                        </td>
                        <td className="p-3 text-right font-semibold text-zinc-900">
                          {formatCurrency(billedPrice, currency)}
                        </td>
                        <td className="p-3 text-right">
                          {priceDiff > 0 ? (
                            <span className="text-amber-800 font-bold">+{formatCurrency(priceDiff, currency)}</span>
                          ) : (
                            <span className="text-emerald-700">✓ 0.00</span>
                          )}
                        </td>
                        <td className="p-3 text-right text-zinc-500">{grnQty !== null ? grnQty : "—"}</td>
                        <td className="p-3 text-right font-semibold text-zinc-900">
                          <span className={qtyDiff > 0 ? "text-rose-600 font-bold" : "text-zinc-900"}>{billedQty}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Audit Findings & Variance Notes */}
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-zinc-200 bg-zinc-50 space-y-1.5 text-xs">
                <div className="flex justify-between font-bold text-zinc-900">
                  <span>Match Audit Status:</span>
                  <span className="font-mono uppercase">{inspectingBill.matchingStatus}</span>
                </div>
                <div className="flex justify-between text-zinc-600">
                  <span>Net Price Variance Exposure:</span>
                  <span className="font-mono font-bold text-amber-800">
                    +{formatCurrency(parseFloat(inspectingBill.priceVarianceAmount || "0"), currency)}
                  </span>
                </div>
                {inspectingBill.varianceNotes && (
                  <div className="pt-2 border-t border-zinc-200 mt-2">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase">Audit Trail & Variance Notes:</p>
                    <p className="text-zinc-800 italic mt-0.5">{inspectingBill.varianceNotes}</p>
                  </div>
                )}
              </div>

              {/* ATTACHED VENDOR INVOICE DOCUMENT (MINIO) */}
              <div className="p-4 rounded-xl border border-zinc-200 bg-white">
                <ReceiptAttachmentUploader
                  shopSlug={shopSlug}
                  category="vendor-bills"
                  attachmentUrl={inspectingBill.attachmentUrl}
                  attachmentName={inspectingBill.attachmentName}
                  attachmentSize={inspectingBill.attachmentSize}
                  onUploadSuccess={async (data) => {
                    const updated = {
                      ...inspectingBill,
                      attachmentUrl: data.url,
                      attachmentName: data.name,
                      attachmentSize: data.size,
                    };
                    setInspectingBill(updated);
                    setBills((prev) => prev.map((b) => (b.id === inspectingBill.id ? updated : b)));
                    await updateVendorBillAttachment(inspectingBill.id, shopSlug, {
                      attachmentUrl: data.url,
                      attachmentName: data.name,
                      attachmentSize: data.size,
                    });
                    toast.success("Vendor invoice attached to bill!");
                  }}
                  onRemove={async () => {
                    const updated = {
                      ...inspectingBill,
                      attachmentUrl: null,
                      attachmentName: null,
                      attachmentSize: null,
                    };
                    setInspectingBill(updated);
                    setBills((prev) => prev.map((b) => (b.id === inspectingBill.id ? updated : b)));
                    await updateVendorBillAttachment(inspectingBill.id, shopSlug, {
                      attachmentUrl: null,
                      attachmentName: null,
                      attachmentSize: null,
                    });
                    toast.success("Attachment removed.");
                  }}
                  label="Vendor Invoice / Tax Receipt Document (MinIO)"
                  helperText="Upload vendor's tax invoice PDF or scan for 3-way audit compliance"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-zinc-100">
              <button
                onClick={() => setInspectingBill(null)}
                className="btn-primary-modern px-5 py-2 text-xs font-semibold uppercase tracking-wider"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. VARIANCE APPROVAL OVERRIDE MODAL */}
      {overrideBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Authorize Variance Override</h3>
                <p className="text-xs text-zinc-500">Bill: {overrideBill.billNumber}</p>
              </div>
              <button onClick={() => setOverrideBill(null)} className="text-zinc-400 hover:text-zinc-600">
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1 text-amber-900">
              <p className="font-bold">⚠️ 3-Way Match Variance Warning</p>
              <p>
                This bill exhibits a {overrideBill.matchingStatus.replace(/_/g, " ")}. Approving this bill will post a liability
                of {formatCurrency(parseFloat(overrideBill.netPayable), currency)} to General Ledger Account 2100.
              </p>
              {parseFloat(overrideBill.priceVarianceAmount) > 0 && (
                <p className="font-mono font-bold">
                  Price Variance: +{formatCurrency(parseFloat(overrideBill.priceVarianceAmount), currency)}
                </p>
              )}
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-zinc-800">
                Controller Override Justification <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="State why this price or quantity variance was accepted (e.g., Executive approval email on file, revised supplier quotation #...)"
                value={overrideNotesInput}
                onChange={(e) => setOverrideNotesInput(e.target.value)}
                className="w-full px-3 py-2 border border-zinc-200 rounded-lg bg-white"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
              <button
                type="button"
                onClick={() => setOverrideBill(null)}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOverrideApprove}
                disabled={isApprovingOverride}
                className="px-5 py-2 text-xs font-semibold uppercase tracking-wider bg-amber-800 hover:bg-amber-900 text-white rounded-lg disabled:opacity-50"
              >
                {isApprovingOverride ? "Approving..." : "Authorize & Sign Off"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. PAYMENT RECORDING MODAL */}
      {payingBill && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-zinc-200 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900">Record Vendor Bill Payment</h3>
                <p className="text-xs text-zinc-500">
                  Bill: {payingBill.billNumber} ({payingBill.supplier.name})
                </p>
              </div>
              <button onClick={() => setPayingBill(null)} className="text-zinc-400 hover:text-zinc-600">
                ✕
              </button>
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
                  Net Balance Due:{" "}
                  {formatCurrency(
                    Math.max(0, parseFloat(payingBill.netPayable) - parseFloat(payingBill.amountPaid)),
                    currency
                  )}
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

      {/* 9. PRINTABLE REMITTANCE ADVICE MODAL */}
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
                  <p className="text-zinc-500 text-[11px]">
                    DATE: {new Date().toLocaleDateString("en-KE", { dateStyle: "long" })}
                  </p>
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
                  <p className="font-semibold text-zinc-900">Channel: {voucherBill.paymentChannel || "BANK EFT"}</p>
                  <p className="font-mono text-zinc-600">Ref: {voucherBill.paymentReference || "DIRECT"}</p>
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
                      <td className="py-2 text-right">{formatCurrency(parseFloat(it.totalAmount), currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="border-t border-zinc-200 pt-3 space-y-1 font-mono text-xs">
                <div className="flex justify-between">
                  <span>Gross Bill Total:</span>
                  <span>{formatCurrency(parseFloat(voucherBill.totalAmount), currency)}</span>
                </div>
                {parseFloat(voucherBill.whtAmount) > 0 && (
                  <div className="flex justify-between text-amber-700 font-semibold">
                    <span>Withholding Tax Withheld ({parseFloat(voucherBill.whtRate)}%):</span>
                    <span>-{formatCurrency(parseFloat(voucherBill.whtAmount), currency)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-zinc-900 pt-1 border-t border-zinc-100">
                  <span>Total Amount Paid / Disbursed:</span>
                  <span>{formatCurrency(parseFloat(voucherBill.amountPaid), currency)}</span>
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
