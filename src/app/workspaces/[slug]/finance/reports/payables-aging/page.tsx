import { db } from "@/db";
import { shops, suppliers, documents } from "@/db/schema";
import { eq, and, ne } from "drizzle-orm";
import { notFound } from "next/navigation";
import { PayablesAgingClient, type SupplierAgingItem } from "./PayablesAgingClient";

interface PayablesAgingPageProps {
  params: Promise<{ slug: string }>;
}

export default async function PayablesAgingPage({ params }: PayablesAgingPageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) {
    notFound();
  }

  // Fetch all suppliers with their unpaid documents
  const shopSuppliers = await db.query.suppliers.findMany({
    where: eq(suppliers.shopId, shop.id),
    with: {
      documents: {
        where: and(
          ne(documents.status, "PAID"),
          ne(documents.status, "CANCELLED")
        ),
      },
    },
    orderBy: (s, { asc }) => [asc(s.name)],
  });

  const now = new Date();

  // Process aging buckets per supplier
  const agingData: SupplierAgingItem[] = [];

  for (const supp of shopSuppliers) {
    let current = 0;
    let days31to60 = 0;
    let days61to90 = 0;
    let days90Plus = 0;
    let total = 0;

    const docItems = (supp.documents || []).map((doc) => {
      const issueTime = new Date(doc.issueDate).getTime();
      const diffMs = now.getTime() - issueTime;
      const daysAge = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      const amt = parseFloat(doc.grandTotal || "0");

      if (daysAge <= 30) {
        current += amt;
      } else if (daysAge <= 60) {
        days31to60 += amt;
      } else if (daysAge <= 90) {
        days61to90 += amt;
      } else {
        days90Plus += amt;
      }

      total += amt;

      return {
        id: doc.id,
        docNumber: doc.docNumber,
        type: doc.type,
        issueDate: String(doc.issueDate),
        dueDate: doc.dueDate ? String(doc.dueDate) : null,
        grandTotal: doc.grandTotal,
        status: doc.status,
        daysOverdue: daysAge,
      };
    });

    if (docItems.length > 0 || total > 0) {
      agingData.push({
        supplierId: supp.id,
        supplierName: supp.name,
        email: supp.email,
        phone: supp.phone,
        taxPin: supp.taxPin,
        paymentTerms: supp.paymentTerms,
        currentAmount: current,
        days31to60: days31to60,
        days61to90: days61to90,
        days90Plus: days90Plus,
        totalPayable: total,
        documentsCount: docItems.length,
        documents: docItems,
      });
    }
  }

  // Sort by highest total payable
  agingData.sort((a, b) => b.totalPayable - a.totalPayable);

  return (
    <div className="p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white">
      <PayablesAgingClient
        shopSlug={slug}
        shopName={shop.name}
        currency={shop.currency || "KES"}
        agingData={agingData}
      />
    </div>
  );
}
