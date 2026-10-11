// src/lib/actions/audit.ts
import { apiClient } from "@/lib/api/client";

/**
 * All supported audit action types
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
 * Records an audit log entry via the FastAPI backend.
 */
export async function recordAuditLog(input: AuditInput): Promise<void> {
    try {
        await apiClient.post("/v1/audit", input);
    } catch {
        // Silently swallow audit failures so primary operations are uninterrupted
    }
}
