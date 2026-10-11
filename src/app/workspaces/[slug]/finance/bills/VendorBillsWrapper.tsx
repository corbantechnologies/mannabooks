"use client";

import { useBills, useApprovedPosAndGrns } from "@/hooks/useBills";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useAccounts } from "@/hooks/useFinance";
import { VendorBillsClient } from "./VendorBillsClient";
import { Spinner } from "@/components/Spinner";

interface VendorBillsWrapperProps {
  shopId: string;
  shopSlug: string;
  shopName: string;
  currency: string;
  isGlEnabled: boolean;
}

export function VendorBillsWrapper({
  shopId,
  shopSlug,
  shopName,
  currency,
  isGlEnabled,
}: VendorBillsWrapperProps) {
  const { data: bills = [], isLoading: isLoadingBills } = useBills(shopId);
  const { data: rawSuppliers = [], isLoading: isLoadingSuppliers } = useSuppliers(shopId);
  const { data: rawAccounts = [], isLoading: isLoadingAccounts } = useAccounts(shopId);
  const { data: matchData, isLoading: isLoadingMatch } = useApprovedPosAndGrns(shopId);

  if (isLoadingBills || isLoadingSuppliers || isLoadingAccounts || isLoadingMatch) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3">
        <Spinner size={24} />
        <p className="text-xs text-zinc-500 font-mono tracking-wider uppercase">Loading vendor bills &amp; 3-way match data...</p>
      </div>
    );

  }

  const shopSuppliers: any[] = Array.isArray(rawSuppliers) ? rawSuppliers : [];
  const accounts: any[] = Array.isArray(rawAccounts) ? rawAccounts : [];
  const pos: any[] = matchData?.pos || [];
  const grns: any[] = matchData?.grns || [];

  const formattedBills = (Array.isArray(bills) ? bills : []).map((b: any) => ({
    id: b.id,
    billNumber: b.billNumber || b.bill_number,
    reference: b.reference,
    billDate: b.billDate || b.bill_date ? String(b.billDate || b.bill_date) : new Date().toISOString(),
    dueDate: b.dueDate || b.due_date ? String(b.dueDate || b.due_date) : null,
    subTotal: String(b.subTotal || b.sub_total || "0"),
    taxAmount: String(b.taxAmount || b.tax_amount || "0"),
    whtRate: String(b.whtRate || b.wht_rate || "0"),
    whtAmount: String(b.whtAmount || b.wht_amount || "0"),
    totalAmount: String(b.totalAmount || b.total_amount || "0"),
    netPayable: String(b.netPayable || b.net_payable || "0"),
    amountPaid: String(b.amountPaid || b.amount_paid || "0"),
    status: b.status,
    paymentChannel: b.paymentChannel || b.payment_channel,
    paymentReference: b.paymentReference || b.payment_reference,
    attachmentUrl: b.attachmentUrl || b.attachment_url,
    attachmentName: b.attachmentName || b.attachment_name,
    attachmentSize: b.attachmentSize || b.attachment_size,
    notes: b.notes,
    sourcePoId: b.sourcePoId || b.source_po_id,
    sourceGrnId: b.sourceGrnId || b.source_grn_id,
    matchingStatus: b.matchingStatus || b.matching_status || "UNMATCHED",
    priceVarianceAmount: String(b.priceVarianceAmount || b.price_variance_amount || "0.00"),
    quantityVarianceCount: Number(b.quantityVarianceCount || b.quantity_variance_count || 0),
    varianceNotes: b.varianceNotes || b.variance_notes,
    sourcePo: b.sourcePo || b.source_po ? {
      id: b.sourcePo?.id || b.source_po?.id,
      docNumber: b.sourcePo?.docNumber || b.source_po?.doc_number,
      issueDate: String(b.sourcePo?.issueDate || b.source_po?.issue_date || ""),
      grandTotal: String(b.sourcePo?.grandTotal || b.source_po?.grand_total || "0"),
    } : null,
    sourceGrn: b.sourceGrn || b.source_grn ? {
      id: b.sourceGrn?.id || b.source_grn?.id,
      docNumber: b.sourceGrn?.docNumber || b.source_grn?.doc_number,
      issueDate: String(b.sourceGrn?.issueDate || b.source_grn?.issue_date || ""),
    } : null,
    supplier: b.supplier ? {
      id: b.supplier.id,
      name: b.supplier.name,
      email: b.supplier.email,
      phone: b.supplier.phone,
      taxPin: b.supplier.taxPin || b.supplier.tax_pin,
    } : { id: "", name: "Unknown", email: null, phone: null, taxPin: null },
    items: (b.items || []).map((it: any) => ({
      id: it.id,
      description: it.description,
      quantity: String(it.quantity || "1"),
      unitPrice: String(it.unitPrice || it.unit_price || "0"),
      taxRate: String(it.taxRate || it.tax_rate || "0"),
      totalAmount: String(it.totalAmount || it.total_amount || "0"),
      poItemId: it.poItemId || it.po_item_id,
      poUnitPrice: it.poUnitPrice ? String(it.poUnitPrice) : null,
      grnQuantity: it.grnQuantity ? String(it.grnQuantity) : null,
      account: it.account ? {
        id: it.account.id,
        code: it.account.code,
        name: it.account.name,
      } : null,
    })),
  }));

  const formattedSuppliers = shopSuppliers.map((s: any) => ({
    id: s.id,
    name: s.name,
    email: s.email || "",
    taxPin: s.taxPin ?? s.tax_pin ?? null,
    paymentTerms: s.paymentTerms ?? s.payment_terms ?? null,
  }));

  const formattedAccounts = accounts.map((a: any) => ({
    id: a.id,
    code: a.code,
    name: a.name,
    accountType: a.accountType ?? a.account_type,
  }));

  const formattedPos = pos.map((p: any) => ({
    id: p.id,
    docNumber: p.docNumber || p.doc_number,
    type: p.type,
    supplierId: p.supplierId ?? p.supplier_id ?? null,
    issueDate: String(p.issueDate || p.issue_date || ""),
    grandTotal: String(p.grandTotal || p.grand_total || "0"),
    items: (p.items || []).map((it: any) => ({
      id: it.id,
      description: it.description,
      quantity: String(it.quantity || "1"),
      unitPrice: String(it.unitPrice || it.unit_price || "0"),
      taxType: it.taxType || it.tax_type,
    })),
  }));

  const formattedGrns = grns.map((g: any) => ({
    id: g.id,
    docNumber: g.docNumber || g.doc_number,
    type: g.type,
    supplierId: g.supplierId ?? g.supplier_id ?? null,
    issueDate: String(g.issueDate || g.issue_date || ""),
    items: (g.items || []).map((it: any) => ({
      id: it.id,
      description: it.description,
      quantity: String(it.quantity || "1"),
      unitPrice: String(it.unitPrice || it.unit_price || "0"),
      taxType: it.taxType || it.tax_type,
    })),
  }));

  return (
    <VendorBillsClient
      shopSlug={shopSlug}
      shopName={shopName}
      currency={currency}
      isGlEnabled={isGlEnabled}
      initialBills={formattedBills}
      suppliers={formattedSuppliers}
      accounts={formattedAccounts}
      availablePos={formattedPos}
      availableGrns={formattedGrns}
    />
  );
}
