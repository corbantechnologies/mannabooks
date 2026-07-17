// Default Chart of Accounts seeded on GL activation
export const DEFAULT_ACCOUNTS = [
    { code: "1100", name: "Accounts Receivable",   accountType: "ASSET"     as const, isSystem: true },
    { code: "1200", name: "Cash & Bank",            accountType: "ASSET"     as const, isSystem: true },
    { code: "1300", name: "Inventory",              accountType: "ASSET"     as const, isSystem: true },
    { code: "2100", name: "Accounts Payable",       accountType: "LIABILITY" as const, isSystem: true },
    { code: "2200", name: "Payroll Payable",        accountType: "LIABILITY" as const, isSystem: true },
    { code: "3100", name: "Owner's Equity",         accountType: "EQUITY"    as const, isSystem: true },
    { code: "3200", name: "Opening Balances",       accountType: "EQUITY"    as const, isSystem: true },
    { code: "4100", name: "Sales Revenue",          accountType: "REVENUE"   as const, isSystem: true },
    { code: "4200", name: "Non-Operating Income",   accountType: "REVENUE"   as const, isSystem: true },
    { code: "5100", name: "Cost of Goods Sold",     accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6100", name: "Rent & Lease",           accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6200", name: "Utilities",              accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6300", name: "Salaries & Wages",       accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6400", name: "Fuel & Travel",          accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6500", name: "Marketing & Ads",        accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6600", name: "Office Supplies",        accountType: "EXPENSE"   as const, isSystem: true },
    { code: "6900", name: "Other Expenses",         accountType: "EXPENSE"   as const, isSystem: true },
];

// Map expense categories to GL account codes
export const EXPENSE_CATEGORY_ACCOUNT_MAP: Record<string, string> = {
    RENT: "6100",
    UTILITIES: "6200",
    SALARIES: "6300",
    FUEL: "6400",
    MARKETING: "6500",
    OFFICE_SUPPLIES: "6600",
    OTHER: "6900",
};
