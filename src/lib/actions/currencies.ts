"use server";

import { db } from "@/db";
import { shopCurrencies, shops } from "@/db/schema";
import { eq, and, asc } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { verifyAndGetSession } from "./auth";
import { enforcePermission } from "./rbac";

export interface ShopCurrencyRecord {
  id: string;
  shopId: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: string;
  isEnabled: boolean;
  updatedAt: Date;
}

const DEFAULT_CURRENCY_PRESETS = [
  { code: "USD", name: "US Dollar", symbol: "$", defaultRateKES: 129.50 },
  { code: "EUR", name: "Euro", symbol: "€", defaultRateKES: 141.20 },
  { code: "GBP", name: "British Pound", symbol: "£", defaultRateKES: 168.50 },
  { code: "UGX", name: "Ugandan Shilling", symbol: "USh", defaultRateKES: 0.0350 },
  { code: "TZS", name: "Tanzanian Shilling", symbol: "TSh", defaultRateKES: 0.0500 },
  { code: "RWF", name: "Rwandan Franc", symbol: "RF", defaultRateKES: 0.0960 },
  { code: "ZAR", name: "South African Rand", symbol: "R", defaultRateKES: 7.10 },
  { code: "AED", name: "UAE Dirham", symbol: "د.إ", defaultRateKES: 35.25 },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥", defaultRateKES: 17.90 },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$", defaultRateKES: 95.50 },
];

/**
 * Fetch all configured currencies for a shop, auto-seeding standard presets if empty.
 */
export async function getShopCurrencies(shopId: string, baseCurrency: string = "KES"): Promise<ShopCurrencyRecord[]> {
  try {
    const existing = await db.query.shopCurrencies.findMany({
      where: eq(shopCurrencies.shopId, shopId),
      orderBy: [asc(shopCurrencies.code)],
    });

    if (existing.length > 0) {
      return existing;
    }

    // Auto-seed initial top presets (USD, EUR, GBP, UGX, TZS)
    const initialSeeds = DEFAULT_CURRENCY_PRESETS.slice(0, 5).filter(c => c.code !== baseCurrency);
    for (const seed of initialSeeds) {
      await db.insert(shopCurrencies).values({
        shopId,
        code: seed.code,
        name: seed.name,
        symbol: seed.symbol,
        exchangeRate: seed.defaultRateKES.toFixed(4),
        isEnabled: true,
      }).onConflictDoNothing();
    }

    return await db.query.shopCurrencies.findMany({
      where: eq(shopCurrencies.shopId, shopId),
      orderBy: [asc(shopCurrencies.code)],
    });
  } catch (error) {
    console.error("Failed to load shop currencies:", error);
    return [];
  }
}

/**
 * Save or update a currency definition and its predefined exchange rate.
 */
export async function saveShopCurrencyAction(input: {
  shopId: string;
  shopSlug: string;
  code: string;
  name: string;
  symbol?: string;
  exchangeRate: number;
  isEnabled?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized. Please log in." };
    await enforcePermission(input.shopId, "manage_settings");

    if (!input.code || input.code.trim().length !== 3) {
      return { success: false, error: "Valid 3-letter currency code is required (e.g. USD, EUR)." };
    }
    if (input.exchangeRate <= 0 || isNaN(input.exchangeRate)) {
      return { success: false, error: "Exchange rate must be greater than zero." };
    }

    const cleanCode = input.code.trim().toUpperCase();

    const existing = await db.query.shopCurrencies.findFirst({
      where: and(eq(shopCurrencies.shopId, input.shopId), eq(shopCurrencies.code, cleanCode)),
    });

    if (existing) {
      await db.update(shopCurrencies)
        .set({
          name: input.name.trim(),
          symbol: input.symbol?.trim() || existing.symbol,
          exchangeRate: input.exchangeRate.toFixed(4),
          isEnabled: input.isEnabled !== undefined ? input.isEnabled : existing.isEnabled,
          updatedAt: new Date(),
        })
        .where(eq(shopCurrencies.id, existing.id));
    } else {
      await db.insert(shopCurrencies).values({
        shopId: input.shopId,
        code: cleanCode,
        name: input.name.trim(),
        symbol: input.symbol?.trim() || "$",
        exchangeRate: input.exchangeRate.toFixed(4),
        isEnabled: input.isEnabled !== undefined ? input.isEnabled : true,
      });
    }

    revalidatePath(`/workspaces/${input.shopSlug}/settings/currencies`);
    revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save currency:", error);
    return { success: false, error: error.message || "Failed to save currency settings." };
  }
}

/**
 * Delete a custom currency definition from workspace portfolio.
 */
export async function deleteShopCurrencyAction(input: {
  shopId: string;
  shopSlug: string;
  currencyId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };
    await enforcePermission(input.shopId, "manage_settings");

    await db.delete(shopCurrencies).where(
      and(eq(shopCurrencies.id, input.currencyId), eq(shopCurrencies.shopId, input.shopId))
    );

    revalidatePath(`/workspaces/${input.shopSlug}/settings/currencies`);
    revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete currency:", error);
    return { success: false, error: error.message || "Failed to delete currency." };
  }
}

/**
 * Sync all configured shop currencies with live market exchange rates.
 */
export async function syncShopCurrenciesWithLiveRatesAction(input: {
  shopId: string;
  shopSlug: string;
  baseCurrency: string;
}): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  try {
    const session = await verifyAndGetSession();
    if (!session) return { success: false, error: "Unauthorized." };
    await enforcePermission(input.shopId, "manage_settings");

    const allCurrencies = await db.query.shopCurrencies.findMany({
      where: eq(shopCurrencies.shopId, input.shopId),
    });

    if (allCurrencies.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    let updatedCount = 0;
    const base = input.baseCurrency.toUpperCase();

    // Fetch rates against base currency
    for (const curr of allCurrencies) {
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${curr.code}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.rates && typeof data.rates[base] === "number") {
            const liveRate = data.rates[base];
            await db.update(shopCurrencies)
              .set({
                exchangeRate: liveRate.toFixed(4),
                updatedAt: new Date(),
              })
              .where(eq(shopCurrencies.id, curr.id));
            updatedCount++;
          }
        }
      } catch (err) {
        console.warn(`Could not sync live rate for ${curr.code}:`, err);
      }
    }

    revalidatePath(`/workspaces/${input.shopSlug}/settings/currencies`);
    revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
    return { success: true, updatedCount };
  } catch (error: any) {
    console.error("Failed to sync live rates:", error);
    return { success: false, error: error.message || "Failed to sync live exchange rates." };
  }
}
