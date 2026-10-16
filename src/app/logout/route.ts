// src/app/logout/route.ts
import { redirect } from "next/navigation";
import { invalidateSession } from "@/lib/actions/auth";

export async function GET() {
    // Revokes the refresh-token family and the access token server-side, then clears the cookies.
    await invalidateSession();
    redirect("/login?cleared=1");
}
