"use server";

import { apiClient } from "@/lib/api/client";
import { revalidatePath } from "next/cache";

export interface ShopCurrencyRecord {
  id: string;
  shopId: string;
  code: string;
  name: string;
  symbol: string;
  exchangeRate: string;
  isEnabled: boolean;
  updatedAt: string | Date;
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
 * Fetch all configured currencies for a shop via FastAPI, auto-seeding standard presets if empty.
 */
export async function getShopCurrencies(shopId: string, baseCurrency: string = "KES"): Promise<ShopCurrencyRecord[]> {
  try {
    const res = await apiClient.get<{ success: boolean; currencies: ShopCurrencyRecord[] }>(
      `/v1/workspaces/${shopId}/currencies`
    );

    if (res.data?.success && Array.isArray(res.data.currencies) && res.data.currencies.length > 0) {
      return res.data.currencies;
    }

    // Auto-seed initial top presets (USD, EUR, GBP, UGX, TZS)
    const initialSeeds = DEFAULT_CURRENCY_PRESETS.slice(0, 5).filter(c => c.code !== baseCurrency);
    for (const seed of initialSeeds) {
      await apiClient.post(`/v1/workspaces/${shopId}/currencies`, {
        code: seed.code,
        name: seed.name,
        symbol: seed.symbol,
        exchange_rate: seed.defaultRateKES,
        is_enabled: true,
      });
    }

    const recheck = await apiClient.get<{ success: boolean; currencies: ShopCurrencyRecord[] }>(
      `/v1/workspaces/${shopId}/currencies`
    );
    return recheck.data?.currencies || [];
  } catch (error) {
    console.error("Failed to load shop currencies via FastAPI:", error);
    return [];
  }
}

/**
 * Save or update a currency definition via FastAPI.
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
    if (!input.code || input.code.trim().length !== 3) {
      return { success: false, error: "Valid 3-letter currency code is required (e.g. USD, EUR)." };
    }
    if (input.exchangeRate <= 0 || isNaN(input.exchangeRate)) {
      return { success: false, error: "Exchange rate must be greater than zero." };
    }

    const res = await apiClient.post(`/v1/workspaces/${input.shopId}/currencies`, {
      code: input.code.trim().toUpperCase(),
      name: input.name.trim(),
      symbol: input.symbol?.trim() || "$",
      exchange_rate: input.exchangeRate,
      is_enabled: input.isEnabled !== undefined ? input.isEnabled : true,
    });

    if (res.error) {
      return { success: false, error: res.error };
    }

    revalidatePath(`/workspaces/${input.shopSlug}/settings/currencies`);
    revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to save currency via FastAPI:", error);
    return { success: false, error: error.message || "Failed to save currency settings." };
  }
}

/**
 * Delete a custom currency definition from workspace portfolio via FastAPI.
 */
export async function deleteShopCurrencyAction(input: {
  shopId: string;
  shopSlug: string;
  currencyId: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await apiClient.delete(`/v1/workspaces/${input.shopId}/currencies/${input.currencyId}`);
    if (res.error) {
      return { success: false, error: res.error };
    }

    revalidatePath(`/workspaces/${input.shopSlug}/settings/currencies`);
    revalidatePath(`/workspaces/${input.shopSlug}/documents/new`);
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete currency via FastAPI:", error);
    return { success: false, error: error.message || "Failed to delete currency." };
  }
}

/**
 * Sync all configured shop currencies with live market exchange rates via FastAPI.
 */
export async function syncShopCurrenciesWithLiveRatesAction(input: {
  shopId: string;
  shopSlug: string;
  baseCurrency: string;
}): Promise<{ success: boolean; updatedCount?: number; error?: string }> {
  try {
    const currencies = await getShopCurrencies(input.shopId, input.baseCurrency);
    if (currencies.length === 0) {
      return { success: true, updatedCount: 0 };
    }

    let updatedCount = 0;
    const base = input.baseCurrency.toUpperCase();

    for (const curr of currencies) {
      try {
        const response = await fetch(`https://open.er-api.com/v6/latest/${curr.code}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.rates && typeof data.rates[base] === "number") {
            const liveRate = data.rates[base];
            await saveShopCurrencyAction({
              shopId: input.shopId,
              shopSlug: input.shopSlug,
              code: curr.code,
              name: curr.name,
              symbol: curr.symbol,
              exchangeRate: liveRate,
              isEnabled: curr.isEnabled,
            });
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
    console.error("Failed to sync live rates via FastAPI:", error);
    return { success: false, error: error.message || "Failed to sync live exchange rates." };
  }
}
