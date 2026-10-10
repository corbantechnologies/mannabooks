import { NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const cronSecret = process.env.CRON_SECRET;
    const isDev = process.env.NODE_ENV === "development";

    if (!isDev && (!cronSecret || authHeader !== `Bearer ${cronSecret}`)) {
        return new Response("Unauthorized CRON request", { status: 401 });
    }

    const res = await apiClient.post<any>("/v1/crons/process-recurring");
    if (res.data) {
        return NextResponse.json({ success: true, ...res.data });
    }

    return NextResponse.json({ success: false, error: res.error || "Execution failed" }, { status: res.status || 500 });
}

export async function POST(request: Request) {
    return GET(request);
}
