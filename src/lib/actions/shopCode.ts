// src/lib/actions/shopCode.ts
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";

/**
 * Generates a unique 5-character uppercase alphanumeric code for a shop/workspace.
 */
export async function generateUniqueShopCode(txOrDb: any = db): Promise<string> {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let attempts = 0;
    
    while (attempts < 100) {
        let code = "";
        for (let i = 0; i < 5; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        // Verify code is not already assigned
        const existing = await txOrDb.query.shops.findFirst({
            where: eq(shops.code, code),
        });
        
        if (!existing) {
            return code;
        }
        attempts++;
    }
    
    throw new Error("Failed to generate a unique shop code after 100 attempts.");
}
