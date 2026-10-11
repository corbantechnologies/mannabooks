// src/types/crm.ts
/**
 * Pure TypeScript domain definitions for CRM and Deals.
 */

export type DealStage = "LEAD" | "QUALIFIED" | "PROPOSAL_SENT" | "NEGOTIATION" | "WON" | "LOST";
export type DealActivityType = "NOTE" | "CALL" | "EMAIL" | "MEETING" | "STAGE_CHANGE" | "PROPOSAL_SENT" | "PROPOSAL_ACCEPTED" | "WON" | "LOST";

export interface CreateDealInput {
    shopId: string;
    shopSlug: string;
    title: string;
    contactName: string;
    contactEmail?: string;
    contactPhone?: string;
    clientId?: string;
    estimatedValue?: number;
    winProbability?: number;
    expectedCloseDate?: Date;
    currency?: string;
    notes?: string;
}

export interface UpdateDealInput {
    dealId: string;
    shopId: string;
    shopSlug: string;
    title?: string;
    contactName?: string;
    contactEmail?: string;
    contactPhone?: string;
    clientId?: string;
    estimatedValue?: number;
    winProbability?: number;
    expectedCloseDate?: Date;
    currency?: string;
}
