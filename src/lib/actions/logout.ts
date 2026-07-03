"use server";

import { invalidateSession } from "@/lib/actions/auth";
import { redirect } from "next/navigation";

/**
 * Destroys the active session cookie and purges the DB row,
 * then hard-redirects to the login gate.
 */
export async function logoutAction() {
    await invalidateSession();
    redirect("/login");
}
