import { isAuthorizedCron } from "@/lib/security/secrets";
import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

export async function GET(req: NextRequest) {
    return handleCron(req);
}

export async function POST(req: NextRequest) {
    return handleCron(req);
}

async function handleCron(req: NextRequest) {
    if (!isAuthorizedCron(req)) {
        return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: 401 });
    }

    const res = await apiClient.post<any>("/v1/crons/overdue-sweep");
    if (res.data) {
        return NextResponse.json({ success: true, ...res.data });
    }

    return NextResponse.json({ success: false, error: res.error || "Execution failed" }, { status: res.status || 500 });
}
