import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { getActiveFiscalYearContext } from "@/lib/fiscal-year-context";
import { notFound } from "next/navigation";
import { AnalyticsClientView } from "./AnalyticsClientView";

interface AnalyticsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceAnalyticsPage({ params }: AnalyticsPageProps) {
  const { slug } = await params;

  // 1. Resolve multi-tenant shop criteria
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  const { activeFiscalYear, allFiscalYears } = await getActiveFiscalYearContext(shop.id);

  return (
    <div className="p-5 sm:p-7 space-y-6">
      <AnalyticsClientView
        shopId={shop.id}
        shopSlug={slug}
        fiscalYearStartMonth={shop.fiscalYearStartMonth}
        activeFiscalYear={activeFiscalYear}
        allFiscalYears={allFiscalYears}
      />
    </div>
  );
}
