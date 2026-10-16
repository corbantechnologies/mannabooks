import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { apiClient } from "@/lib/api/client";
import { escapeHtml } from "@/lib/utils";

interface QuoteResult {
  success: boolean;
  status: string;
  serial: string;
  documentId: string;
  grandTotal: number;
  currency: string;
  token: string | null;
  notify: {
    shopName: string;
    shopEmail: string | null;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    itemCount: number;
    workspaceLink: string;
  };
}

/**
 * Public catalog "request a quote". Forwards to the API (which prices items server-side, creates the
 * quotation and notifies the shop in-app), then emails the customer and the shop.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ success: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot filled in: pretend success so bots learn nothing.
  if (typeof body.website === "string" && body.website.trim()) {
    return NextResponse.json({ success: true, serial: "RECEIVED", token: null });
  }

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0].trim();
  const res = await apiClient.post<QuoteResult>(
    `/v1/portal/catalog/${encodeURIComponent(slug)}/quote`,
    {
      customerName: body.customerName,
      customerEmail: body.customerEmail || null,
      customerPhone: body.customerPhone || null,
      customerNotes: body.customerNotes || null,
      items: body.items,
    },
    { anonymous: true, headers: clientIp ? { "X-Client-IP": clientIp } : undefined }
  );

  if (res.error || !res.data?.success) {
    return NextResponse.json({ success: false, error: res.error || "Could not submit your request." }, { status: res.status || 500 });
  }

  const data = res.data;
  await sendEmails(data).catch((err) => console.error("Catalog quote emails failed:", err));

  return NextResponse.json({
    success: true,
    serial: data.serial,
    status: data.status,
    token: data.token,
    documentId: data.token ? data.documentId : undefined,
    grandTotal: data.grandTotal,
  });
}

async function sendEmails(data: QuoteResult) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;
  const resend = new Resend(apiKey);
  const from = process.env.RESEND_FROM_EMAIL || "Manna Books <billing@mannabooks.co.ke>";
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://www.mannabooks.co.ke").replace(/\/$/, "");
  const n = data.notify;
  const total = `${escapeHtml(data.currency)} ${Number(data.grandTotal).toLocaleString("en-KE", { minimumFractionDigits: 2 })}`;

  const jobs: Promise<unknown>[] = [];

  if (n.customerEmail) {
    const portal = data.token ? `${appUrl}/portal/invoice/${encodeURIComponent(data.token)}` : null;
    jobs.push(
      resend.emails.send({
        from,
        to: [n.customerEmail],
        replyTo: n.shopEmail ? [n.shopEmail] : undefined,
        subject: portal ? `Your quotation ${data.serial} from ${n.shopName}` : `We received your quote request (${data.serial})`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <h2>${escapeHtml(n.shopName)}</h2>
            <p>Hi ${escapeHtml(n.customerName)},</p>
            ${
              portal
                ? `<p>Your quotation <strong>${escapeHtml(data.serial)}</strong> for ${n.itemCount} item(s), total <strong>${total}</strong>, is ready.</p>
                   <p><a href="${escapeHtml(portal)}" style="display:inline-block;background:#000;color:#fff;padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">View quotation</a></p>`
                : `<p>Thanks for your request (reference <strong>${escapeHtml(data.serial)}</strong>, ${n.itemCount} item(s)). Our team will review it and send you a formal quotation shortly.</p>`
            }
          </div>`,
      })
    );
  }

  if (n.shopEmail) {
    jobs.push(
      resend.emails.send({
        from,
        to: [n.shopEmail],
        replyTo: n.customerEmail ? [n.customerEmail] : undefined,
        subject: `New catalog quote request ${data.serial} from ${n.customerName}`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;">
            <h2>New quote request</h2>
            <p><strong>${escapeHtml(n.customerName)}</strong> requested ${n.itemCount} item(s), total ${total}.</p>
            <p>Email: ${escapeHtml(n.customerEmail || "—")}<br/>Phone: ${escapeHtml(n.customerPhone || "—")}</p>
            <p>${data.token ? "The quotation was issued automatically." : "A draft quotation is waiting for your review."}</p>
            <p><a href="${escapeHtml(appUrl + n.workspaceLink)}">Open in MannaBooks</a></p>
          </div>`,
      })
    );
  }

  await Promise.all(jobs);
}
