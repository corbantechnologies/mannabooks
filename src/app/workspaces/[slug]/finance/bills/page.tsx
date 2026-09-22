import { db } from "@/db";
import { shops, suppliers, chartOfAccounts } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getVendorBills } from "@/lib/actions/bills";
import { VendorBillsClient } from "./VendorBillsClient";

interface VendorBillsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function VendorBillsPage({ params }: VendorBillsPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  const [bills, shopSuppliers, accounts] = await Promise.all([
    getVendorBills(slug),
    db.query.suppliers.findMany({
      where: eq(suppliers.shopId, shop.id),
      orderBy: [asc(suppliers.name)],
    }),
    db.query.chartOfAccounts.findMany({
      where: eq(chartOfAccounts.shopId, shop.id),
      orderBy: [asc(chartOfAccounts.code)],
    }),
  ]);

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <div className="space-y-1">
        <span className="text-xs text-zinc-400 font-mono uppercase tracking-wider">Accounts Payable</span>
        <h1 className="text-[22px] font-semibold text-zinc-900 leading-tight">Vendor Bills & Remittance</h1>
        <p className="text-sm text-zinc-500">
          Register inbound vendor invoices, manage multi-tier approvals, apply automatic Withholding Tax (WHT) splits,
          and issue payment vouchers with remittance advice.
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
          notes: b.notes,
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
      />
    </div>
  );
}
