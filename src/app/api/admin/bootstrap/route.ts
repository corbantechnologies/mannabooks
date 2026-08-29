import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, shops } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import { verifyAndGetSession } from "@/lib/actions/auth";

/**
 * Super Admin Bootstrap API Endpoint
 * 
 * Allows creating or elevating an initial Super Admin account.
 * Usage:
 * POST /api/admin/bootstrap with JSON: { "email": "business@corbantechnologies.org" }
 * Or GET /api/admin/bootstrap?email=business@corbantechnologies.org
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const email = (body.email || "").trim().toLowerCase();

        if (!email) {
            return NextResponse.json({ success: false, error: "Please provide an email address in the request body." }, { status: 400 });
        }

        return await elevateUser(email);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to elevate user." }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    try {
        const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
        
        if (!email) {
            // If logged in, elevate current user
            const session = await verifyAndGetSession();
            if (session?.user?.email) {
                return await elevateUser(session.user.email);
            }
            return NextResponse.json({
                success: false,
                error: "Please provide an email parameter, e.g. /api/admin/bootstrap?email=your-email@domain.com"
            }, { status: 400 });
        }

        return await elevateUser(email);
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message || "Failed to process request." }, { status: 500 });
    }
}

async function elevateUser(email: string) {
    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) {
        return NextResponse.json({
            success: false,
            error: `User "${email}" was not found in the database. Please sign up on MannaBooks first, then call this endpoint.`
        }, { status: 404 });
    }

    await db.update(users).set({
        isSuperAdmin: true,
        isLifetimePro: true,
    }).where(eq(users.id, user.id));

    await db.update(shops).set({
        isLifetimePro: true,
        subscriptionStatus: "LIFETIME_FREE",
        plan: "PRO",
    }).where(eq(shops.ownerId, user.id));

    return NextResponse.json({
        success: true,
        message: `👑 Account "${user.email}" (${user.name || "Admin"}) has been elevated to Super Admin (ROOT) & Lifetime PRO. All owned workspaces have been upgraded.`,
        adminUrl: "/admin",
        instructions: "Log in and navigate to /admin to access the Platform Super Admin Terminal."
    });
}
