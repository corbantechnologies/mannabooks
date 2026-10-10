import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";

/**
 * Super Admin Bootstrap API Endpoint
 * Delegates to FastAPI /v1/admin/bootstrap endpoint.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const email = (body.email || "").trim().toLowerCase();

        if (!email) {
            return NextResponse.json({ success: false, error: "Please provide an email address in the request body." }, { status: 400 });
        }

        const res = await apiClient<{ success: boolean; message?: string; error?: string }>("/v1/admin/bootstrap", {
            method: "POST",
            body: JSON.stringify({ email }),
        });

        if (!res.data?.success) {
            return NextResponse.json({ success: false, error: res.error || "Failed to elevate user." }, { status: res.status || 400 });
        }

        return NextResponse.json(res.data);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to elevate user." }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
        
        if (!email) {
            const meRes = await apiClient<{ success: boolean; user: any }>("/v1/auth/me");
            if (meRes.data?.user?.email) {
                const res = await apiClient<{ success: boolean; message?: string; error?: string }>("/v1/admin/bootstrap", {
                    method: "POST",
                    body: JSON.stringify({ email: meRes.data.user.email }),
                });
                return NextResponse.json(res.data || { success: false, error: res.error });
            }
            return NextResponse.json({
                success: false,
                error: "Please provide an email parameter, e.g. /api/admin/bootstrap?email=your-email@domain.com"
            }, { status: 400 });
        }

        const res = await apiClient<{ success: boolean; message?: string; error?: string }>("/v1/admin/bootstrap", {
            method: "POST",
            body: JSON.stringify({ email }),
        });
        return NextResponse.json(res.data || { success: false, error: res.error });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to process request." }, { status: 500 });
    }
}
