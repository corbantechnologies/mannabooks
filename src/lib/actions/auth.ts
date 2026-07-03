"use server";

import { db } from "@/db";
import { users, shops, shopMembers } from "@/db/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

interface RegisterOwnerInput {
    name: string;
    email: string;
    passwordHex: string;
    businessName: string;
}

export async function registerOwnerAccount(input: RegisterOwnerInput) {
    try {
        return await db.transaction(async (tx) => {

            // 1. Enforce unique emails at the application level
            const existingUser = await tx.query.users.findFirst({
                where: eq(users.email, input.email.toLowerCase().trim()),
            });

            if (existingUser) {
                return { success: false, error: "An account with this email already exists." };
            }

            // 2. Hash the password securely
            const saltRounds = 10;
            const hashedPass = await bcrypt.hash(input.passwordHex, saltRounds);

            // 3. Write the User profile
            const [newUser] = await tx.insert(users).values({
                name: input.name.trim(),
                email: input.email.toLowerCase().trim(),
                passwordHash: hashedPass,
            }).returning();

            // 4. Generate a clean unique URL slug from the business name
            const baseSlug = input.businessName
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-") // Replace spaces/special chars with hyphens
                .replace(/(^-|-$)+/g, "");   // Clean up trailing hyphens

            // Verify if slug is unique; if not, append a quick timestamp string
            const existingSlug = await tx.query.shops.findFirst({
                where: eq(shops.slug, baseSlug),
            });
            const finalSlug = existingSlug ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

            // 5. Write the Shop Workspace profile
            const [newShop] = await tx.insert(shops).values({
                ownerId: newUser.id,
                name: input.businessName.trim(),
                slug: finalSlug,
                currency: "KES", // Default baseline currency
                primaryColor: "#000000", // Stark sleek default
                isVatRegistered: false,  // Default to non-VAT until configured
            }).returning();

            // 6. Create the Bridge Membership Record linking User to Shop as OWNER
            await tx.insert(shopMembers).values({
                shopId: newShop.id,
                userId: newUser.id,
                role: "OWNER",
                isActive: true,
            });

            return {
                success: true,
                userId: newUser.id,
                shopId: newShop.id,
                shopSlug: newShop.slug
            };
        });
    } catch (error) {
        console.error("Critical error during merchant onboarding transaction:", error);
        return { success: false, error: "Account initialization failed. Please try again." };
    }
}