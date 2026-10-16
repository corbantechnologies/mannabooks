import { getActiveWorkspaceContext } from "@/lib/workspace-context";
import { getActiveFiscalYearContext } from "@/lib/fiscal-year-context";
import { apiClient } from "@/lib/api/client";
import { notFound } from "next/navigation";
import { FiscalYearsPageClient } from "./FiscalYearsPageClient";

interface FiscalYearsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function FiscalYearsManagementPage({ params }: FiscalYearsPageProps) {
  const { slug } = await params;
  const { shop } = await getActiveWorkspaceContext(slug);

  if (!shop) {
    notFound();
  }

  const { activeFiscalYear, allFiscalYears } = await getActiveFiscalYearContext(shop.id);

  // Fetch full details from backend
  let fiscalYears = allFiscalYears;
  try {
    const res = await apiClient<{ success: boolean; fiscalYears: any[] }>(
      `/v1/accounts/fiscal-years?shop_id=${shop.id}`
    );
    if (res.data?.success && Array.isArray(res.data.fiscalYears)) {
      fiscalYears = res.data.fiscalYears;
    }
  } catch (err) {
    console.warn("[FiscalYearsPage] Failed to fetch fiscal years list", err);
  }

  return (
    <FiscalYearsPageClient
      shop={shop}
      shopSlug={slug}
      activeFiscalYear={activeFiscalYear}
      initialFiscalYears={fiscalYears}
    />
  );
}
