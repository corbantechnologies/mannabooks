import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { apiClient } from "@/lib/api/client";
import { notFound } from "next/navigation";
import { VendorBillsClient } from "./VendorBillsClient";

interface VendorBillsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function VendorBillsPage({ params }: VendorBillsPageProps) {
  const { slug } = await params;

  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  const [billsRes, suppRes, accRes, matchRes] = await Promise.all([
    apiClient.get<any>(`/v1/bills?shop_id=${shop.id}`),
    apiClient.get<any[]>(`/v1/suppliers?shop_id=${shop.id}`),
    apiClient.get<any[]>(`/v1/accounts?shop_id=${shop.id}`),
    apiClient.get<any>(`/v1/bills/approved-pos-grns?shop_id=${shop.id}`),
  ]);

  const bills: any[] = billsRes.data?.bills || [];
  const shopSuppliers: any[] = suppRes.data || [];
  const accounts: any[] = accRes.data || [];
  const pos: any[] = matchRes.data?.pos || [];
  const grns: any[] = matchRes.data?.grns || [];

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <div className="space-y-1">
        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Accounts Payable & 3-Way Match</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 leading-tight">Vendor Bills & 3-Way Matching</h1>
        <p className="text-sm text-zinc-500">
          Reconcile Purchase Orders (PO/LPO), Goods Received Notes (GRN), and Vendor Invoices with automated 3-Way Matching,
          detect price/quantity variances, manage multi-tier approvals, and issue remittance vouchers.
        </p>
      </div>

      <VendorBillsClient
        shopSlug={slug}
        shopName={shop.name}
        currency={shop.currency}
        isGlEnabled={shop.isGlEnabled}
        initialBills={bills.map((b: any) => ({
          id: b.id,
          billNumber: b.billNumber,
          reference: b.reference,
          billDate: b.billDate ? (typeof b.billDate === "string" ? b.billDate : b.billDate.toISOString()) : new Date().toISOString(),
          dueDate: b.dueDate ? (typeof b.dueDate === "string" ? b.dueDate : b.dueDate.toISOString()) : null,
          subTotal: b.subTotal,
          taxAmount: b.taxAmount,
          whtRate: b.whtRate,
          whtAmount: b.whtAmount,
          totalAmount: b.totalAmount,
          netPayable: b.netPayable,
          amountPaid: b.amountPaid,
          status: b.status,
          paymentChannel: b.paymentChannel,
          paymentReference: b.paymentReference,
          attachmentUrl: b.attachmentUrl,
          attachmentName: b.attachmentName,
          attachmentSize: b.attachmentSize,
          notes: b.notes,
          sourcePoId: b.sourcePoId,
          sourceGrnId: b.sourceGrnId,
          matchingStatus: b.matchingStatus || "UNMATCHED",
          priceVarianceAmount: b.priceVarianceAmount || "0.00",
          quantityVarianceCount: Number(b.quantityVarianceCount || 0),
          varianceNotes: b.varianceNotes,
          sourcePo: b.sourcePo ? {
            id: b.sourcePo.id,
            docNumber: b.sourcePo.docNumber,
            issueDate: typeof b.sourcePo.issueDate === "string" ? b.sourcePo.issueDate : b.sourcePo.issueDate.toISOString(),
            grandTotal: b.sourcePo.grandTotal,
          } : null,
          sourceGrn: b.sourceGrn ? {
            id: b.sourceGrn.id,
            docNumber: b.sourceGrn.docNumber,
            issueDate: typeof b.sourceGrn.issueDate === "string" ? b.sourceGrn.issueDate : b.sourceGrn.issueDate.toISOString(),
          } : null,
          supplier: b.supplier ? {
            id: b.supplier.id,
            name: b.supplier.name,
            email: b.supplier.email,
            phone: b.supplier.phone,
            taxPin: b.supplier.taxPin,
          } : { id: "", name: "Unknown", email: null, phone: null, taxPin: null },
          items: (b.items || []).map((it: any) => ({
            id: it.id,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxRate: it.taxRate,
            totalAmount: it.totalAmount,
            poItemId: it.poItemId,
            poUnitPrice: it.poUnitPrice,
            grnQuantity: it.grnQuantity,
            account: it.account ? {
              id: it.account.id,
              code: it.account.code,
              name: it.account.name,
            } : null,
          })),
        }))}
        suppliers={shopSuppliers.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          taxPin: s.taxPin ?? s.tax_pin,
          paymentTerms: s.paymentTerms ?? s.payment_terms,
        }))}
        accounts={accounts.map((a: any) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          accountType: a.accountType ?? a.account_type,
        }))}
        availablePos={pos.map((p: any) => ({
          id: p.id,
          docNumber: p.docNumber,
          type: p.type,
          supplierId: p.supplierId ?? p.supplier_id,
          issueDate: typeof p.issueDate === "string" ? p.issueDate : (p.issueDate?.toISOString?.() || ""),
          grandTotal: p.grandTotal,
          items: (p.items || []).map((it: any) => ({
            id: it.id,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxType: it.taxType,
          })),
        }))}
        availableGrns={grns.map((g: any) => ({
          id: g.id,
          docNumber: g.docNumber,
          type: g.type,
          supplierId: g.supplierId ?? g.supplier_id,
          issueDate: typeof g.issueDate === "string" ? g.issueDate : (g.issueDate?.toISOString?.() || ""),
          items: (g.items || []).map((it: any) => ({
            id: it.id,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxType: it.taxType,
          })),
        }))}
      />
    </div>
  );
}
