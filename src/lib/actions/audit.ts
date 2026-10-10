"use server";

import { db } from "@/db";
import { auditLogs } from "@/db/schema";

/**
 * All supported audit action types — must match the auditActionEnum in schema.ts
 */
export type AuditAction =
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "STATUS_CHANGE"
    | "ROLE_CHANGE"
    | "PAYMENT_RECORDED"
    | "PAYMENT_DELETED"
    | "PERIOD_CLOSED"
    | "PERIOD_REOPENED"
    | "FISCAL_YEAR_CLOSED"
    | "FISCAL_YEAR_REOPENED"
    | "MEMBER_ADDED"
    | "MEMBER_REMOVED"
    | "CANCELLATION";

export interface AuditInput {
    shopId: string;
    userId: string | null | undefined;
    action: AuditAction;
    tableName: string;
    recordId?: string;
    recordLabel?: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    ipAddress?: string;
}

/**
 * Fire-and-forget audit log writer.
 * Always call this AFTER the main mutation succeeds.
 * This function intentionally never throws — a logging failure
 * must never rollback a financial transaction.
 */
export async function logAudit(input: AuditInput): Promise<void> {
    try {
        const { apiClient } = await import("@/lib/api/client");
        await apiClient.post("/v1/governance/audit-logs", {
            shop_id: input.shopId,
            action: input.action,
            table_name: input.tableName,
            record_id: input.recordId,
            record_label: input.recordLabel,
            before_state: input.before,
            after_state: input.after,
            ip_address: input.ipAddress,
        });
    } catch (err) {
        // Silently swallow — audit log failures must never surface to the user
        console.error("[AuditLog] Failed to write audit entry:", err);
    }
}
