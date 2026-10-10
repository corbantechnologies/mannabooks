import { getActiveWorkspaceContext } from "@/lib/actions/workspace";
import { db } from "@/db";
import { shops, suppliers, chartOfAccounts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getVendorBills, getApprovedPosAndGrns } from "@/lib/actions/bills";
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

  const [bills, shopSuppliers, accounts, { pos, grns }] = await Promise.all([
    getVendorBills(slug),
    db.query.suppliers.findMany({
      where: eq(suppliers.shopId, shop.id),
      orderBy: [asc(suppliers.name)],
    }),
    db.query.chartOfAccounts.findMany({
      where: eq(chartOfAccounts.shopId, shop.id),
      orderBy: [asc(chartOfAccounts.code)],
    }),
    getApprovedPosAndGrns(slug),
  ]);

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
        initialBills={bills.map((b) => ({
          id: b.id,
          billNumber: b.billNumber,
          reference: b.reference,
          billDate: b.billDate.toISOString(),
          dueDate: b.dueDate ? b.dueDate.toISOString() : null,
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
            issueDate: b.sourcePo.issueDate.toISOString(),
            grandTotal: b.sourcePo.grandTotal,
          } : null,
          sourceGrn: b.sourceGrn ? {
            id: b.sourceGrn.id,
            docNumber: b.sourceGrn.docNumber,
            issueDate: b.sourceGrn.issueDate.toISOString(),
          } : null,
          supplier: {
            id: b.supplier.id,
            name: b.supplier.name,
            email: b.supplier.email,
            phone: b.supplier.phone,
            taxPin: b.supplier.taxPin,
          },
          items: b.items.map((it) => ({
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
        suppliers={shopSuppliers.map((s) => ({
          id: s.id,
          name: s.name,
          email: s.email,
          taxPin: s.taxPin,
          paymentTerms: s.paymentTerms,
        }))}
        accounts={accounts.map((a) => ({
          id: a.id,
          code: a.code,
          name: a.name,
          accountType: a.accountType,
        }))}
        availablePos={pos.map((p) => ({
          id: p.id,
          docNumber: p.docNumber,
          type: p.type,
          supplierId: p.supplierId,
          issueDate: p.issueDate.toISOString(),
          grandTotal: p.grandTotal,
          items: p.items.map((it) => ({
            id: it.id,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            taxType: it.taxType,
          })),
        }))}
        availableGrns={grns.map((g) => ({
          id: g.id,
          docNumber: g.docNumber,
          type: g.type,
          supplierId: g.supplierId,
          issueDate: g.issueDate.toISOString(),
          items: g.items.map((it) => ({
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
