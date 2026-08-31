import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documents, notifications } from "@/db/schema";
import { eq, and, isNotNull, lt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  return handleCron(req);
}

export async function POST(req: NextRequest) {
  return handleCron(req);
}

async function handleCron(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  const urlSecret = req.nextUrl.searchParams.get("secret");

  // Allow execution if CRON_SECRET matches, or in development mode
  if (cronSecret && authHeader !== `Bearer ${cronSecret}` && urlSecret !== cronSecret) {
    return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: 401 });
  }

  const now = new Date();

  const summary = {
    totalEvaluated: 0,
    expiredCount: 0,
    notificationsCreated: 0,
    errors: [] as string[],
  };

  try {
    // 1. Fetch all ISSUED quotations with past due/validity dates
    const expiredQuotes = await db.query.documents.findMany({
      where: and(
        eq(documents.type, "QUOTATION"),
        eq(documents.status, "ISSUED"),
        isNotNull(documents.dueDate),
        lt(documents.dueDate, now)
      ),
      with: {
        shop: {
          with: {
            owner: true,
          },
        },
        client: true,
      },
    });

    summary.totalEvaluated = expiredQuotes.length;

    for (const quote of expiredQuotes) {
      try {
        await db.transaction(async (tx) => {
          // 2. Mark quote status as CANCELLED (Expired)
          await tx
            .update(documents)
            .set({
              status: "CANCELLED",
            })
            .where(eq(documents.id, quote.id));

          // 3. Create in-app notification for the workspace owner
          if (quote.shop?.ownerId) {
            const clientName = quote.client?.name || "Client";
            await tx.insert(notifications).values({
              userId: quote.shop.ownerId,
              shopId: quote.shopId,
              title: `⏳ Quotation ${quote.docNumber} Expired`,
              message: `Quotation ${quote.docNumber} for ${clientName} (${quote.currency || quote.shop?.currency || "KES"} ${quote.grandTotal}) reached its validity deadline and was marked as expired.`,
              type: "QUOTE_EXPIRED",
              link: quote.shop?.slug ? `/workspaces/${quote.shop.slug}/documents/${quote.id}` : null,
              isRead: false,
            });
            summary.notificationsCreated++;
          }
        });

        summary.expiredCount++;
      } catch (err: any) {
        console.error(`Failed to process expired quote ${quote.id}:`, err);
        summary.errors.push(`Quote ${quote.docNumber}: ${err.message}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Quotation expiry sweep complete. ${summary.expiredCount} expired quote(s) updated.`,
      summary,
    });
  } catch (error: any) {
    console.error("Quotation expiry sweep failed:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute quotation expiry sweep." },
      { status: 500 }
    );
  }
}
