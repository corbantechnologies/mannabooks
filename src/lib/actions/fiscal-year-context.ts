"use server";

import { db } from "@/db";
import { fiscalYears, accountingPeriods, shops } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

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
 * Normalizes a Date or string to a local-timezone YYYY-MM-DD string.
 */
function toLocalDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Gets the active contextual fiscal year for a given shop.
 * Priority:
 * 1. User's cookie `mannabooks_fy_${shopId}`
 * 2. Database `is_current = true`
 * 3. Latest open fiscal year
 * 4. Latest declared fiscal year
 */
export async function getActiveFiscalYearContext(shopId: string): Promise<ActiveFiscalYearResult> {
  const allFys = await db.query.fiscalYears.findMany({
    where: eq(fiscalYears.shopId, shopId),
    orderBy: [desc(fiscalYears.startDate)],
  });

  const formattedFys: FiscalYearOption[] = allFys.map((fy) => ({
    id: fy.id,
    label: fy.label,
    startDate: fy.startDate,
    endDate: fy.endDate,
    isClosed: fy.isClosed,
    isCurrent: fy.isCurrent,
  }));

  if (formattedFys.length === 0) {
    return { activeFiscalYear: null, allFiscalYears: [] };
  }

  // Check cookie
  const cookieStore = await cookies();
  const cookieFyId = cookieStore.get(`mannabooks_fy_${shopId}`)?.value;

  if (cookieFyId) {
    const matchedFromCookie = formattedFys.find((f) => f.id === cookieFyId);
    if (matchedFromCookie) {
      return { activeFiscalYear: matchedFromCookie, allFiscalYears: formattedFys };
    }
  }

  // Fallback 1: isCurrent in DB
  const currentDbFy = formattedFys.find((f) => f.isCurrent);
  if (currentDbFy) {
    return { activeFiscalYear: currentDbFy, allFiscalYears: formattedFys };
  }

  // Fallback 2: latest open FY
  const openFy = formattedFys.find((f) => !f.isClosed);
  if (openFy) {
    return { activeFiscalYear: openFy, allFiscalYears: formattedFys };
  }

  // Fallback 3: first FY in list
  return { activeFiscalYear: formattedFys[0], allFiscalYears: formattedFys };
}

/**
 * Switches the active fiscal year context for a shop.
 * Stores in an HTTP cookie and updates database isCurrent flag.
 */
export async function switchFiscalYearContextAction(
  shopId: string,
  shopSlug: string,
  fiscalYearId: string
) {
  try {
    const fy = await db.query.fiscalYears.findFirst({
      where: and(eq(fiscalYears.id, fiscalYearId), eq(fiscalYears.shopId, shopId)),
    });

    if (!fy) {
      return { success: false, error: "Fiscal year not found in this workspace." };
    }

    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(`mannabooks_fy_${shopId}`, fiscalYearId, {
      path: "/",
      maxAge: 31536000, // 1 year
      sameSite: "lax",
    });

    // Update DB isCurrent flags
    await db.transaction(async (tx) => {
      await tx
        .update(fiscalYears)
        .set({ isCurrent: false })
        .where(eq(fiscalYears.shopId, shopId));

      await tx
        .update(fiscalYears)
        .set({ isCurrent: true })
        .where(eq(fiscalYears.id, fiscalYearId));
    });

    revalidatePath(`/workspaces/${shopSlug}`);
    revalidatePath(`/workspaces/${shopSlug}/analytics`);
    revalidatePath(`/workspaces/${shopSlug}/finance`);
    revalidatePath(`/workspaces/${shopSlug}/finance/periods`);
    revalidatePath(`/workspaces/${shopSlug}/finance/reports`);

    return {
      success: true,
      fiscalYear: {
        id: fy.id,
        label: fy.label,
        startDate: fy.startDate,
        endDate: fy.endDate,
        isClosed: fy.isClosed,
        isCurrent: true,
      },
    };
  } catch (error: any) {
    console.error("Failed to switch fiscal year context:", error);
    return { success: false, error: error?.message || "Failed to switch fiscal year." };
  }
}

/**
 * Creates and declares a new Fiscal Year for the shop, provisions periods,
 * and sets it as the active context.
 */
export async function declareNewFiscalYearAction(
  shopId: string,
  shopSlug: string,
  data: {
    label: string;
    startDate: string;
    endDate: string;
    setAsActive?: boolean;
  }
) {
  try {
    const label = data.label.trim();
    if (!label || !data.startDate || !data.endDate) {
      return { success: false, error: "Label, start date, and end date are required." };
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return { success: false, error: "Invalid date format." };
    }

    if (end <= start) {
      return { success: false, error: "End Date must be after Start Date." };
    }

    const startStr = toLocalDateStr(start);
    const endStr = toLocalDateStr(end);

    // Overlap check
    const allFy = await db.query.fiscalYears.findMany({
      where: eq(fiscalYears.shopId, shopId),
    });

    for (const fy of allFy) {
      if (startStr <= fy.endDate && endStr >= fy.startDate) {
        return {
          success: false,
          error: `The declared date range overlaps with existing Fiscal Year "${fy.label}" (${fy.startDate} to ${fy.endDate}).`,
        };
      }
    }

    const setAsActive = data.setAsActive ?? true;

    let createdFyId = "";

    await db.transaction(async (tx) => {
      if (setAsActive) {
        await tx
          .update(fiscalYears)
          .set({ isCurrent: false })
          .where(eq(fiscalYears.shopId, shopId));
      }

      const [createdFy] = await tx
        .insert(fiscalYears)
        .values({
          shopId,
          label,
          startDate: startStr,
          endDate: endStr,
          isClosed: false,
          isCurrent: setAsActive,
        })
        .returning();

      createdFyId = createdFy.id;

      // Auto-populate 12 monthly accounting periods
      let current = new Date(start.getFullYear(), start.getMonth(), 1);
      while (current <= end) {
        const pStart = new Date(current.getFullYear(), current.getMonth(), 1);
        const actualStart = pStart < start ? start : pStart;

        const pEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
        const actualEnd = pEnd > end ? end : pEnd;

        const periodName = actualStart.toLocaleDateString("en-KE", {
          month: "long",
          year: "numeric",
        });
        const actualStartStr = toLocalDateStr(actualStart);
        const actualEndStr = toLocalDateStr(actualEnd);

        const existing = await tx.query.accountingPeriods.findFirst({
          where: and(
            eq(accountingPeriods.shopId, shopId),
            eq(accountingPeriods.startDate, actualStartStr)
          ),
        });

        if (existing) {
          await tx
            .update(accountingPeriods)
            .set({ fiscalYearId: createdFy.id })
            .where(eq(accountingPeriods.id, existing.id));
        } else {
          await tx.insert(accountingPeriods).values({
            shopId,
            fiscalYearId: createdFy.id,
            periodName,
            startDate: actualStartStr,
            endDate: actualEndStr,
            status: "OPEN",
          });
        }

        current.setMonth(current.getMonth() + 1);
      }
    });

    if (setAsActive && createdFyId) {
      const cookieStore = await cookies();
      cookieStore.set(`mannabooks_fy_${shopId}`, createdFyId, {
        path: "/",
        maxAge: 31536000,
        sameSite: "lax",
      });
    }

    revalidatePath(`/workspaces/${shopSlug}`);
    revalidatePath(`/workspaces/${shopSlug}/finance/periods`);

    return { success: true, fiscalYearId: createdFyId };
  } catch (error: any) {
    console.error("Failed to declare fiscal year:", error);
    return { success: false, error: error?.message || "Failed to declare fiscal year." };
  }
}
