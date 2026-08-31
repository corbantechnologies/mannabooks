import { NextRequest, NextResponse } from "next/server";

// Standard fallback rates against USD / KES if external service is unreachable
const FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  KES: 129.50,
  EUR: 0.92,
  GBP: 0.79,
  UGX: 3720.0,
  TZS: 2600.0,
  RWF: 1350.0,
  ZAR: 18.20,
  AED: 3.67,
  CNY: 7.23,
  CAD: 1.36,
  AUD: 1.52,
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const from = (searchParams.get("from") || "USD").toUpperCase();
    const to = (searchParams.get("to") || "KES").toUpperCase();

    // 1. Attempt live fetch from free open exchange rates provider
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${from}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.rates && typeof data.rates[to] === "number") {
          return NextResponse.json({
            success: true,
            from,
            to,
            rate: data.rates[to],
            lastUpdated: data.time_last_update_utc || new Date().toISOString(),
            source: "live_api",
          });
        }
      }
    } catch (fetchErr) {
      console.warn("External live rate fetch failed, using internal fallback table.", fetchErr);
    }

    // 2. Fallback computation
    const fromRate = FALLBACK_RATES[from] || 1.0;
    const toRate = FALLBACK_RATES[to] || 129.50;
    const computedRate = toRate / fromRate;

    return NextResponse.json({
      success: true,
      from,
      to,
      rate: parseFloat(computedRate.toFixed(4)),
      lastUpdated: new Date().toISOString(),
      source: "fallback_baseline",
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to resolve exchange rate." },
      { status: 500 }
    );
  }
}
