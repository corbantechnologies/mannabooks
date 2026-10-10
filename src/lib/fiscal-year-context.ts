// src/lib/fiscal-year-context.ts
import { apiClient } from "@/lib/api/client";
import { cookies } from "next/headers";

export interface FiscalYearOption {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  isCurrent: boolean;
}

export interface ActiveFiscalYearResult {
  activeFiscalYear: FiscalYearOption | null;
  allFiscalYears: FiscalYearOption[];
}

/**
 * Resolves the contextual fiscal year for a given shop using FastAPI and session cookies.
 */
export async function getActiveFiscalYearContext(shopId: string): Promise<ActiveFiscalYearResult> {
  let formattedFys: FiscalYearOption[] = [];

  try {
    const res = await apiClient<{ success: boolean; fiscalYears: FiscalYearOption[] }>(
      `/v1/accounts/fiscal-years?shop_id=${shopId}`
    );
    if (res.data?.success && Array.isArray(res.data.fiscalYears)) {
      formattedFys = res.data.fiscalYears;
    }
  } catch (err) {
    console.warn("[getActiveFiscalYearContext] API error, falling back", err);
  }

  if (formattedFys.length === 0) {
    return { activeFiscalYear: null, allFiscalYears: [] };
  }

  // Check cookie
  try {
    const cookieStore = await cookies();
    const cookieFyId = cookieStore.get(`mannabooks_fy_${shopId}`)?.value;

    if (cookieFyId) {
      const matchedFromCookie = formattedFys.find((f) => f.id === cookieFyId);
      if (matchedFromCookie) {
        return { activeFiscalYear: matchedFromCookie, allFiscalYears: formattedFys };
      }
    }
  } catch {
    // In environments where cookies() cannot be evaluated
  }

  // Fallback 1: isCurrent flag from backend
  const currentDbFy = formattedFys.find((f) => f.isCurrent);
  if (currentDbFy) {
    return { activeFiscalYear: currentDbFy, allFiscalYears: formattedFys };
  }

  // Fallback 2: first open FY
  const openFy = formattedFys.find((f) => !f.isClosed);
  if (openFy) {
    return { activeFiscalYear: openFy, allFiscalYears: formattedFys };
  }

  // Fallback 3: first FY
  return { activeFiscalYear: formattedFys[0], allFiscalYears: formattedFys };
}
