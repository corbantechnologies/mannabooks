// src/types/models.ts
/**
 * Pure TypeScript domain definitions for MannaBooks frontend.
 * Decoupled from Drizzle and database runtime dependencies.
 */

export type DocumentType =
  | "INVOICE"
  | "QUOTATION"
  | "QUOTE"
  | "RECEIPT"
  | "CREDIT_NOTE"
  | "DEBIT_NOTE"
  | "LPO"
  | "LSO"
  | "PO"
  | "DELIVERY_NOTE"
  | "GOODS_RECEIVED_NOTE"
  | "SERVICE_COMPLETION_NOTE"
  | "PAYMENT_VOUCHER"
  | "PAYROLL_VOUCHER"
  | "PROFORMA";

export type DocumentStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "PAID"
  | "PARTIAL"
  | "OVERDUE"
  | "CANCELLED"
  | "ACCEPTED"
  | "REJECTED"
  | "ISSUED";

export interface DocumentItemModel {
  id?: string;
  productId?: string | null;
  description: string;
  notes?: string | null;
  quantity: number;
  unitPrice: number;
  taxType: "V_16" | "V_0" | "EXEMPT";
  taxAmount?: number;
  itemTotal?: number;
}

export interface DocumentModel {
  id: string;
  shopId: string;
  clientId?: string | null;
  supplierId?: string | null;
  type: DocumentType;
  docNumber: string;
  status: DocumentStatus;
  subTotal: string;
  taxAmount: string;
  grandTotal: string;
  currency: string;
  issueDate: string;
  dueDate?: string | null;
  requiresEtims: boolean;
  kraCuInvoiceNumber?: string | null;
  notes?: string | null;
  termsAndConditions?: string | null;
  items?: DocumentItemModel[];
}

export interface RecurringInvoiceItem {
  id: string;
  docNumber: string;
  clientName: string;
  clientEmail: string;
  clientId?: string | null;
  currency: string;
  grandTotal: string;
  isRecurring: boolean;
  recurringInterval: string;
  nextRecurringDate: string | null;
  createdAt: string;
}

export type CleanSlateMode = "FULL" | "TEST_DATA_ONLY" | "FINANCE_RESET";

export interface SupplierStatementData {
  supplier: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    taxPin?: string | null;
  };
  transactions: any[];
  openingBalance: number;
  closingBalance: number;
  totalDebits: number;
  totalCredits: number;
}

export interface ClientStatementData {
  client: {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    taxPin?: string | null;
  };
  transactions: any[];
  openingBalance: number;
  closingBalance: number;
  totalInvoiced: number;
  totalPaid: number;
}
