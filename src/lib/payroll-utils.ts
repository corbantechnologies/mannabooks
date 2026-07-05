// src/lib/payroll-utils.ts

export type PayrollMode = "KENYA_STATUTORY" | "MANUAL_CUSTOM";

export interface PayrollLineInput {
    baseSalary: number;
    allowances: number;
    commissions: number;
    customDeductions?: number; // e.g. Salary advance, SACCO, loan repayments
    mode?: PayrollMode;
}

export interface StatutoryCalculations {
    grossSalary: number;
    nssf: number;
    shif: number;
    housingLevy: number;
    paye: number;
    customDeductions: number;
    totalDeductions: number;
    netPay: number;
}

/**
 * Computes statutory metrics based on Gross earnings & selected calculation mode.
 * Supports standard Kenyan statutory rates (PAYE, NSSF, SHIF, AHL) or custom manual mode.
 */
export function computeKenyanDeductions(input: PayrollLineInput): StatutoryCalculations {
    const mode = input.mode || "KENYA_STATUTORY";
    const base = Math.round((input.baseSalary || 0) * 100) / 100;
    const allow = Math.round((input.allowances || 0) * 100) / 100;
    const comms = Math.round((input.commissions || 0) * 100) / 100;
    const customDed = Math.round((input.customDeductions || 0) * 100) / 100;

    const grossSalary = Math.round((base + allow + comms) * 100) / 100;

    if (mode === "MANUAL_CUSTOM") {
        const totalDeductions = customDed;
        const netPay = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);
        return {
            grossSalary,
            nssf: 0,
            shif: 0,
            housingLevy: 0,
            paye: 0,
            customDeductions: customDed,
            totalDeductions,
            netPay
        };
    }

    // 1. NSSF: 6% capped at KES 2,160 max (2026 parameters)
    let nssf = Math.round(grossSalary * 0.06 * 100) / 100;
    if (nssf > 2160) nssf = 2160;

    // 2. SHIF: 2.75% of Gross Earnings
    const shif = Math.round(grossSalary * 0.0275 * 100) / 100;

    // 3. Affordable Housing Levy (AHL): 1.5% of Gross Earnings
    const housingLevy = Math.round(grossSalary * 0.015 * 100) / 100;

    // 4. PAYE calculation (NSSF contribution is tax-exempt)
    const taxableIncome = Math.max(0, grossSalary - nssf);
    let grossPaye = 0;

    if (taxableIncome > 0) {
        // Bracket 1: First KES 24,000 at 10%
        const b1 = Math.min(taxableIncome, 24000);
        grossPaye += b1 * 0.10;

        // Bracket 2: Next KES 8,333 at 25%
        if (taxableIncome > 24000) {
            const b2 = Math.min(taxableIncome - 24000, 8333);
            grossPaye += b2 * 0.25;
        }

        // Bracket 3: Amounts above KES 32,333 at 30%
        if (taxableIncome > 32333) {
            const b3 = taxableIncome - 32333;
            grossPaye += b3 * 0.30;
        }
    }

    // Monthly Statutory Personal Tax Relief Offset
    const personalRelief = 2400;
    const paye = grossPaye > personalRelief ? Math.round((grossPaye - personalRelief) * 100) / 100 : 0;

    const totalDeductions = Math.round((nssf + shif + housingLevy + paye + customDed) * 100) / 100;
    const netPay = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

    return {
        grossSalary,
        nssf,
        shif,
        housingLevy,
        paye,
        customDeductions: customDed,
        totalDeductions,
        netPay
    };
}