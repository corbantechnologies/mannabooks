"use server";

import { db } from "@/db";
import { notifications, documents, products, shops } from "@/db/schema";
import { eq, and, desc, or, isNull, sql } from "drizzle-orm";
import { verifyAndGetSession } from "./auth";
import { revalidatePath } from "next/cache";

export type NotificationType =
  | "INVOICE_OVERDUE"
  | "SUBSCRIPTION_ALERT"
  | "QUOTE_EXPIRED"
  | "QUOTE_ACCEPTED"
  | "PAYMENT_RECEIVED"
  | "STOCK_LOW"
  | "SYSTEM";

export interface CreateNotificationInput {
  userId: string;
  shopId?: string | null;
  title: string;
  message: string;
  type?: NotificationType;
  link?: string | null;
}

/**
 * Creates an in-app notification entry.
 */
export async function createNotificationAction(input: CreateNotificationInput) {
  try {
    const [record] = await db
      .insert(notifications)
      .values({
        userId: input.userId,
        shopId: input.shopId || null,
        title: input.title.trim(),
        message: input.message.trim(),
        type: input.type || "SYSTEM",
        link: input.link || null,
        isRead: false,
      })
      .returning();

    return { success: true, notification: record };
  } catch (error: any) {
    console.error("Failed to create notification:", error);
    return { success: false, error: error.message || "Failed to create notification." };
  }
}

/**
 * Fetches recent notifications for the logged-in user and workspace.
 */
export async function getNotificationsAction(shopId?: string) {
  const session = await verifyAndGetSession();
  if (!session) return { success: false, notifications: [], unreadCount: 0 };

  try {
    const whereCondition = shopId
      ? and(
          eq(notifications.userId, session.userId),
          or(eq(notifications.shopId, shopId), isNull(notifications.shopId))
        )
      : eq(notifications.userId, session.userId);

    const userNotifications = await db.query.notifications.findMany({
      where: whereCondition,
      orderBy: [desc(notifications.createdAt)],
      limit: 30,
    });

    const unreadCount = userNotifications.filter((n) => !n.isRead).length;

    return {
      success: true,
      notifications: userNotifications,
      unreadCount,
    };
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error);
    return { success: false, notifications: [], unreadCount: 0 };
  }
}

/**
 * Marks a specific notification as read.
 */
export async function markNotificationReadAction(notificationId: string, shopSlug?: string) {
  const session = await verifyAndGetSession();
  if (!session) return { success: false, error: "Unauthorized." };

  try {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.id, notificationId),
          eq(notifications.userId, session.userId)
        )
      );

    if (shopSlug) {
      revalidatePath(`/workspaces/${shopSlug}`);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark notification as read:", error);
    return { success: false, error: error.message || "Failed to update notification." };
  }
}

/**
 * Marks all notifications for the current user (and shop) as read.
 */
export async function markAllNotificationsReadAction(shopId?: string, shopSlug?: string) {
  const session = await verifyAndGetSession();
  if (!session) return { success: false, error: "Unauthorized." };

  try {
    const whereCondition = shopId
      ? and(
          eq(notifications.userId, session.userId),
          or(eq(notifications.shopId, shopId), isNull(notifications.shopId)),
          eq(notifications.isRead, false)
        )
      : and(
          eq(notifications.userId, session.userId),
          eq(notifications.isRead, false)
        );

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(whereCondition);

    if (shopSlug) {
      revalidatePath(`/workspaces/${shopSlug}`);
    }
    return { success: true };
  } catch (error: any) {
    console.error("Failed to mark all notifications as read:", error);
    return { success: false, error: error.message || "Failed to mark all as read." };
  }
}
