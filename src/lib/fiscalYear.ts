// src/lib/fiscalYear.ts

/**
 * Returns the start and end Date objects for the current fiscal year,
 * given a fiscal year start month (1-indexed: 1 = Jan, 7 = Jul, etc.)
 */
export function getFiscalYearRange(startMonth: number): { start: Date; end: Date; label: string } {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-indexed
    const currentYear = now.getFullYear();

    let fyStartYear: number;

    if (currentMonth >= startMonth) {
        // We are in or past the FY start month — FY started this calendar year
        fyStartYear = currentYear;
    } else {
        // We haven't reached the FY start month — FY started last calendar year
        fyStartYear = currentYear - 1;
    }

    const fyEndYear = fyStartYear + 1;

    const start = new Date(fyStartYear, startMonth - 1, 1, 0, 0, 0);
    const end = new Date(fyEndYear, startMonth - 1, 0, 23, 59, 59);
    // Note: day 0 of month N = last day of month N-1

    // Label: "FY 2025/26" or "FY 2026" if calendar year
    const label = startMonth === 1
        ? `FY ${fyStartYear}`
        : `FY ${fyStartYear}/${String(fyEndYear).slice(-2)}`;

    return { start, end, label };
}

/**
 * Returns the current fiscal quarter boundaries.
 * Quarters are relative to the fiscal year start, not calendar quarters.
 */
export function getFiscalQuarterRange(startMonth: number): { start: Date; end: Date; label: string } {
    const { start: fyStart } = getFiscalYearRange(startMonth);
    const now = new Date();

    // Calculate months elapsed since FY start
    const monthsElapsed = (now.getFullYear() - fyStart.getFullYear()) * 12
        + (now.getMonth() - fyStart.getMonth());

    const quarterIndex = Math.floor(monthsElapsed / 3); // 0, 1, 2, or 3

    const qStart = new Date(fyStart);
    qStart.setMonth(fyStart.getMonth() + (quarterIndex * 3));

    const qEnd = new Date(qStart);
    qEnd.setMonth(qStart.getMonth() + 3, 0);
    qEnd.setHours(23, 59, 59);

    return {
        start: qStart,
        end: qEnd,
        label: `Q${quarterIndex + 1}`,
    };
}

/**
 * Generate a fiscal-year-scoped document serial suffix.
 * e.g., for FY starting July 2025: returns "FY26" (short for the ending year)
 */
export function getFyDocSuffix(startMonth: number): string {
    const { end } = getFiscalYearRange(startMonth);
    return `FY${String(end.getFullYear()).slice(-2)}`;
}
