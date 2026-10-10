import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

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

    const isDev = process.env.NODE_ENV === "development";
    const isAuthorized = cronSecret && (authHeader === `Bearer ${cronSecret}` || urlSecret === cronSecret);

    if (!isDev && !isAuthorized) {
        return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: 401 });
    }

    const res = await apiClient.post<any>("/v1/crons/subscription-lifecycle");
    if (res.data) {
        return NextResponse.json({ success: true, ...res.data });
    }

    return NextResponse.json({ success: false, error: res.error || "Execution failed" }, { status: res.status || 500 });
}
