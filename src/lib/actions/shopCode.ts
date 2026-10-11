// src/lib/actions/shopCode.ts

/**
 * Generates a clean unique shop code from the business name.
 */
export function generateShopCode(name: string): string {
    const clean = (name || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
    const prefix = clean.slice(0, 4).padEnd(4, "X");
    const suffix = Math.floor(1000 + Math.random() * 9000).toString();
    return `${prefix}-${suffix}`;
}

export default generateShopCode;
