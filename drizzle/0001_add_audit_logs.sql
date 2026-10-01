CREATE TYPE "public"."approval_priority" AS ENUM('LOW', 'NORMAL', 'HIGH', 'URGENT');--> statement-breakpoint
CREATE TYPE "public"."approval_request_type" AS ENUM('PURCHASE_REQUISITION', 'PURCHASE_ORDER', 'EXPENSE_CLAIM', 'CREDIT_NOTE', 'STOCK_ADJUSTMENT', 'STOCK_WRITEOFF', 'BUDGET_OVERRUN', 'QUOTE_DISCOUNT', 'INVOICE_CANCELLATION', 'CUSTOM');--> statement-breakpoint
CREATE TYPE "public"."approval_status" AS ENUM('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'ROLE_CHANGE', 'PAYMENT_RECORDED', 'PAYMENT_DELETED', 'PERIOD_CLOSED', 'PERIOD_REOPENED', 'FISCAL_YEAR_CLOSED', 'FISCAL_YEAR_REOPENED', 'MEMBER_ADDED', 'MEMBER_REMOVED', 'CANCELLATION');--> statement-breakpoint
CREATE TYPE "public"."contract_status" AS ENUM('ACTIVE', 'PAUSED', 'EXPIRED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."deal_activity_type" AS ENUM('NOTE', 'CALL', 'EMAIL', 'MEETING', 'STAGE_CHANGE', 'PROPOSAL_SENT', 'PROPOSAL_ACCEPTED', 'WON', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."deal_stage" AS ENUM('LEAD', 'QUALIFIED', 'PROPOSAL_SENT', 'NEGOTIATION', 'WON', 'LOST');--> statement-breakpoint
CREATE TYPE "public"."employment_type" AS ENUM('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERN');--> statement-breakpoint
CREATE TYPE "public"."expense_claim_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'DISBURSED');--> statement-breakpoint
CREATE TYPE "public"."loyalty_engine_mode" AS ENUM('OFF', 'POINTS_ONLY', 'TIERS_ONLY', 'HYBRID');--> statement-breakpoint
CREATE TYPE "public"."loyalty_movement_type" AS ENUM('EARN', 'REDEEM', 'MANUAL_ADJUST', 'EXPIRE', 'WALLET_TOPUP', 'WALLET_DEBIT', 'VOID');--> statement-breakpoint
CREATE TYPE "public"."milestone_status" AS ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'INVOICED');--> statement-breakpoint
CREATE TYPE "public"."production_order_status" AS ENUM('DRAFT', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."project_status" AS ENUM('PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."proposal_status" AS ENUM('DRAFT', 'SENT', 'VIEWED', 'ACCEPTED', 'AMENDMENT_REQUESTED', 'EXPIRED', 'DECLINED');--> statement-breakpoint
CREATE TYPE "public"."stocktake_status" AS ENUM('DRAFT', 'COUNTING', 'COMPLETED', 'CANCELLED');--> statement-breakpoint
CREATE TYPE "public"."timesheet_status" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
ALTER TYPE "public"."doc_status" ADD VALUE 'CONFIRMED';--> statement-breakpoint
ALTER TYPE "public"."doc_type" ADD VALUE 'LSO' BEFORE 'DELIVERY_NOTE';--> statement-breakpoint
ALTER TYPE "public"."doc_type" ADD VALUE 'SERVICE_COMPLETION_NOTE' BEFORE 'PAYMENT_VOUCHER';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'STOREKEEPER' BEFORE 'EMPLOYEE';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'CASHIER' BEFORE 'EMPLOYEE';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'DISPATCHER' BEFORE 'EMPLOYEE';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'SALES_REP' BEFORE 'EMPLOYEE';--> statement-breakpoint
CREATE TABLE "approval_policies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"request_type" "approval_request_type" NOT NULL,
	"name" varchar(150) NOT NULL,
	"min_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"max_amount" numeric(14, 2),
	"required_role" "user_role" DEFAULT 'MANAGER' NOT NULL,
	"auto_approve_below" numeric(14, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "approval_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"policy_id" uuid,
	"request_type" "approval_request_type" NOT NULL,
	"request_number" varchar(50) NOT NULL,
	"requester_user_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"priority" "approval_priority" DEFAULT 'NORMAL' NOT NULL,
	"status" "approval_status" DEFAULT 'PENDING' NOT NULL,
	"target_entity_type" varchar(50) NOT NULL,
	"target_entity_id" uuid NOT NULL,
	"payload_snapshot" jsonb,
	"decision_by_user_id" uuid,
	"decision_at" timestamp,
	"decision_reason" text,
	"approval_token" varchar(64),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "approval_requests_approval_token_unique" UNIQUE("approval_token"),
	CONSTRAINT "unique_shop_request_number" UNIQUE("shop_id","request_number")
);
--> statement-breakpoint
CREATE TABLE "approval_timeline" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"request_id" uuid NOT NULL,
	"user_id" uuid,
	"action" varchar(50) NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid,
	"action" "audit_action" NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid,
	"record_label" varchar(255),
	"before" jsonb,
	"after" jsonb,
	"ip_address" varchar(45),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bill_of_materials" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"finished_product_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"labor_cost_estimate" numeric(14, 2) DEFAULT '0',
	"overhead_cost_estimate" numeric(14, 2) DEFAULT '0',
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "billing_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"checkout_request_id" varchar(100) NOT NULL,
	"merchant_request_id" varchar(100),
	"phone_number" varchar(30) NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"mpesa_receipt_number" varchar(50),
	"status" varchar(30) DEFAULT 'PENDING' NOT NULL,
	"result_code" integer,
	"result_desc" text,
	"target_plan" varchar(30) NOT NULL,
	"billing_months" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	CONSTRAINT "billing_transactions_checkout_request_id_unique" UNIQUE("checkout_request_id")
);
--> statement-breakpoint
CREATE TABLE "bom_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bom_id" uuid NOT NULL,
	"raw_material_product_id" uuid NOT NULL,
	"quantity_required" numeric(12, 4) NOT NULL,
	"wastage_percentage" numeric(5, 2) DEFAULT '0'
);
--> statement-breakpoint
CREATE TABLE "client_loyalty_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"member_number" varchar(50) NOT NULL,
	"tier_id" uuid,
	"current_points" integer DEFAULT 0 NOT NULL,
	"lifetime_points" integer DEFAULT 0 NOT NULL,
	"wallet_balance_kes" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"membership_status" varchar(20) DEFAULT 'ACTIVE' NOT NULL,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "client_loyalty_accounts_client_id_unique" UNIQUE("client_id"),
	CONSTRAINT "client_loyalty_accounts_member_number_unique" UNIQUE("member_number")
);
--> statement-breakpoint
CREATE TABLE "contract_hours_log" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contract_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"logged_by_user_id" uuid,
	"billing_month" varchar(7) NOT NULL,
	"hours_used" numeric(8, 2) NOT NULL,
	"description" text,
	"log_date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"client_id" uuid,
	"deal_id" uuid,
	"contract_number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"status" "contract_status" DEFAULT 'ACTIVE' NOT NULL,
	"monthly_fee" numeric(14, 2) DEFAULT '0' NOT NULL,
	"is_retainer_hours" boolean DEFAULT false NOT NULL,
	"monthly_hours_allocated" numeric(8, 2) DEFAULT '0' NOT NULL,
	"hourly_rate" numeric(12, 2) DEFAULT '0' NOT NULL,
	"auto_invoice_enabled" boolean DEFAULT false NOT NULL,
	"next_billing_date" date,
	"billing_day_of_month" integer DEFAULT 1 NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"alert_30_day_sent_at" timestamp,
	"alert_60_day_sent_at" timestamp,
	"terms_and_conditions" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_contract_number" UNIQUE("shop_id","contract_number")
);
--> statement-breakpoint
CREATE TABLE "cost_centers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"code" varchar(20) NOT NULL,
	"name" text NOT NULL,
	"department" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_cost_center_code" UNIQUE("shop_id","code")
);
--> statement-breakpoint
CREATE TABLE "deal_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deal_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid,
	"activity_type" "deal_activity_type" DEFAULT 'NOTE' NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "deals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"client_id" uuid,
	"assigned_user_id" uuid,
	"title" varchar(255) NOT NULL,
	"contact_name" varchar(255) NOT NULL,
	"contact_email" varchar(255),
	"contact_phone" varchar(50),
	"stage" "deal_stage" DEFAULT 'LEAD' NOT NULL,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"estimated_value" numeric(14, 2) DEFAULT '0' NOT NULL,
	"win_probability" integer DEFAULT 50 NOT NULL,
	"expected_close_date" timestamp,
	"loss_reason" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payment_date" timestamp DEFAULT now() NOT NULL,
	"payment_channel" varchar(50) DEFAULT 'BANK' NOT NULL,
	"payment_reference" varchar(100),
	"notes" text,
	"recorded_by_user_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "expense_claims" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"employee_id" uuid NOT NULL,
	"claim_number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"amount" numeric(15, 2) NOT NULL,
	"claim_date" date NOT NULL,
	"category" "expense_category" DEFAULT 'OFFICE_SUPPLIES' NOT NULL,
	"cost_center_id" uuid,
	"receipt_url" text,
	"status" "expense_claim_status" DEFAULT 'DRAFT' NOT NULL,
	"approved_by_id" uuid,
	"approved_at" timestamp,
	"approval_notes" text,
	"disbursed_expense_id" uuid,
	"disbursed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "group_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(150) NOT NULL,
	"code" varchar(20) NOT NULL,
	"reporting_currency" varchar(3) DEFAULT 'KES' NOT NULL,
	"owner_id" uuid NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "group_entities_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "group_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"entity_type" varchar(30) DEFAULT 'SUBSIDIARY' NOT NULL,
	"ownership_percentage" numeric(5, 2) DEFAULT '100.00' NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_group_shop" UNIQUE("group_id","shop_id")
);
--> statement-breakpoint
CREATE TABLE "inter_company_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"source_shop_id" uuid NOT NULL,
	"target_shop_id" uuid NOT NULL,
	"source_document_id" uuid,
	"target_bill_id" uuid,
	"amount" numeric(15, 2) NOT NULL,
	"currency" varchar(3) DEFAULT 'KES' NOT NULL,
	"transaction_type" varchar(50) DEFAULT 'MANAGEMENT_SERVICES' NOT NULL,
	"is_eliminated" boolean DEFAULT true NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_ledger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"movement_type" "loyalty_movement_type" NOT NULL,
	"points_delta" integer DEFAULT 0 NOT NULL,
	"wallet_delta_kes" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"running_points_balance" integer NOT NULL,
	"running_wallet_balance_kes" numeric(12, 2) NOT NULL,
	"source_document_id" uuid,
	"notes" text,
	"created_by_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "loyalty_programs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"is_enabled" boolean DEFAULT false NOT NULL,
	"engine_mode" "loyalty_engine_mode" DEFAULT 'HYBRID' NOT NULL,
	"program_name" varchar(100) DEFAULT 'Rewards Club' NOT NULL,
	"earn_rate_kes" numeric(10, 2) DEFAULT '100.00' NOT NULL,
	"point_value_kes" numeric(10, 2) DEFAULT '1.00' NOT NULL,
	"min_redeem_points" integer DEFAULT 50 NOT NULL,
	"points_expiry_days" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "loyalty_programs_shop_id_unique" UNIQUE("shop_id")
);
--> statement-breakpoint
CREATE TABLE "membership_tiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"name" varchar(50) NOT NULL,
	"min_spend_kes" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"discount_percent" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"points_multiplier" numeric(4, 2) DEFAULT '1.00' NOT NULL,
	"badge_color" varchar(20) DEFAULT '#71717a' NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shop_id" uuid,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"type" varchar(50) DEFAULT 'SYSTEM' NOT NULL,
	"link" text,
	"is_read" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "platform_plans" (
	"id" varchar(30) PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"tagline" text NOT NULL,
	"price_kes_monthly" integer DEFAULT 0 NOT NULL,
	"price_kes_annually" integer DEFAULT 0 NOT NULL,
	"annual_discount_percent" integer DEFAULT 20 NOT NULL,
	"discounted_price_monthly" integer,
	"discounted_price_annually" integer,
	"max_members" integer DEFAULT 1 NOT NULL,
	"max_locations" integer DEFAULT 1 NOT NULL,
	"can_transfer_stock" boolean DEFAULT false NOT NULL,
	"has_general_ledger" boolean DEFAULT false NOT NULL,
	"has_reconciliation" boolean DEFAULT false NOT NULL,
	"has_statutory_payroll" boolean DEFAULT false NOT NULL,
	"has_api_access" boolean DEFAULT false NOT NULL,
	"badge" varchar(50),
	"is_highlighted" boolean DEFAULT false NOT NULL,
	"features_json" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product_batches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"bin_id" uuid,
	"batch_number" varchar(100) NOT NULL,
	"manufacture_date" date,
	"expiry_date" date NOT NULL,
	"initial_quantity" numeric(12, 2) NOT NULL,
	"current_quantity" numeric(12, 2) NOT NULL,
	"cost_price" numeric(14, 2) NOT NULL,
	"supplier_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "production_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"bom_id" uuid NOT NULL,
	"order_number" varchar(50) NOT NULL,
	"target_location_id" uuid NOT NULL,
	"units_to_produce" numeric(12, 2) NOT NULL,
	"total_cost_kes" numeric(14, 2) DEFAULT '0' NOT NULL,
	"status" "production_order_status" DEFAULT 'DRAFT' NOT NULL,
	"completed_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_production_order_number" UNIQUE("shop_id","order_number")
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(100) DEFAULT 'Team Member' NOT NULL,
	"billable_rate_per_hour" numeric(12, 2) DEFAULT '0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_project_member" UNIQUE("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"percentage_of_total" numeric(5, 2) DEFAULT '0' NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"due_date" date,
	"status" "milestone_status" DEFAULT 'PENDING' NOT NULL,
	"completed_at" timestamp,
	"invoiced_document_id" uuid,
	"display_order" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"client_id" uuid,
	"deal_id" uuid,
	"contract_id" uuid,
	"project_code" varchar(50) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"status" "project_status" DEFAULT 'PLANNING' NOT NULL,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"budget_type" varchar(20) DEFAULT 'FIXED' NOT NULL,
	"budget_amount" numeric(14, 2) DEFAULT '0' NOT NULL,
	"budget_hours" numeric(10, 2) DEFAULT '0' NOT NULL,
	"start_date" date,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_project_code" UNIQUE("shop_id","project_code")
);
--> statement-breakpoint
CREATE TABLE "proposal_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"package_label" varchar(100),
	"description" text NOT NULL,
	"notes" text,
	"quantity" numeric(10, 2) DEFAULT '1' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"item_total" numeric(12, 2) NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proposal_id" uuid NOT NULL,
	"token" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "proposal_tokens_proposal_id_unique" UNIQUE("proposal_id"),
	CONSTRAINT "proposal_tokens_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"deal_id" uuid,
	"client_id" uuid,
	"proposal_number" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"executive_summary" text,
	"scope_of_work" text,
	"terms_and_conditions" text,
	"validity_days" integer DEFAULT 30 NOT NULL,
	"currency" varchar(10) DEFAULT 'KES' NOT NULL,
	"subtotal" numeric(14, 2) DEFAULT '0' NOT NULL,
	"status" "proposal_status" DEFAULT 'DRAFT' NOT NULL,
	"viewed_at" timestamp,
	"view_count" integer DEFAULT 0 NOT NULL,
	"responded_at" timestamp,
	"signer_name" varchar(255),
	"signature_data_url" text,
	"amendment_notes" text,
	"converted_document_id" uuid,
	"sent_at" timestamp,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_proposal_number" UNIQUE("shop_id","proposal_number")
);
--> statement-breakpoint
CREATE TABLE "shop_currencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"code" varchar(3) NOT NULL,
	"name" varchar(50) NOT NULL,
	"symbol" varchar(10) DEFAULT '$' NOT NULL,
	"exchange_rate" numeric(12, 4) DEFAULT '1.0000' NOT NULL,
	"is_enabled" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_currency_code" UNIQUE("shop_id","code")
);
--> statement-breakpoint
CREATE TABLE "stocktake_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"stocktake_id" uuid NOT NULL,
	"product_id" uuid NOT NULL,
	"bin_id" uuid,
	"batch_id" uuid,
	"book_quantity" numeric(12, 2) NOT NULL,
	"counted_quantity" numeric(12, 2) NOT NULL,
	"variance_quantity" numeric(12, 2) NOT NULL,
	"variance_cost_kes" numeric(14, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "stocktakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"stocktake_number" varchar(50) NOT NULL,
	"status" "stocktake_status" DEFAULT 'DRAFT' NOT NULL,
	"conducted_by_user_id" uuid NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_stocktake_number" UNIQUE("shop_id","stocktake_number")
);
--> statement-breakpoint
CREATE TABLE "storage_bins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"location_id" uuid NOT NULL,
	"zone" varchar(50) NOT NULL,
	"rack" varchar(50),
	"shelf" varchar(50),
	"bin_code" varchar(50) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_shop_location_bin" UNIQUE("shop_id","location_id","bin_code")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"plan" varchar(30) NOT NULL,
	"status" varchar(30) DEFAULT 'ACTIVE' NOT NULL,
	"amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"currency" varchar(3) DEFAULT 'KES' NOT NULL,
	"billing_interval" varchar(20) DEFAULT 'MONTHLY' NOT NULL,
	"start_date" timestamp DEFAULT now() NOT NULL,
	"end_date" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "timesheets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"project_id" uuid NOT NULL,
	"shop_id" uuid NOT NULL,
	"user_id" uuid,
	"work_date" date NOT NULL,
	"hours_logged" numeric(8, 2) NOT NULL,
	"task_description" text NOT NULL,
	"is_billable" boolean DEFAULT true NOT NULL,
	"billable_rate" numeric(12, 2) DEFAULT '0' NOT NULL,
	"billable_amount" numeric(12, 2) DEFAULT '0' NOT NULL,
	"status" timesheet_status DEFAULT 'DRAFT' NOT NULL,
	"reviewed_by_user_id" uuid,
	"review_notes" text,
	"invoiced_document_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_bill_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"bill_id" uuid NOT NULL,
	"account_id" uuid NOT NULL,
	"description" text NOT NULL,
	"quantity" numeric(12, 2) DEFAULT '1.00' NOT NULL,
	"unit_price" numeric(12, 2) NOT NULL,
	"tax_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"po_item_id" uuid,
	"po_unit_price" numeric(12, 2),
	"grn_quantity" numeric(12, 2),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "vendor_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shop_id" uuid NOT NULL,
	"supplier_id" uuid NOT NULL,
	"bill_number" varchar(50) NOT NULL,
	"reference" varchar(100),
	"bill_date" timestamp DEFAULT now() NOT NULL,
	"due_date" timestamp,
	"sub_total" numeric(12, 2) NOT NULL,
	"tax_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"wht_rate" numeric(5, 2) DEFAULT '0.00' NOT NULL,
	"wht_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"net_payable" numeric(12, 2) NOT NULL,
	"amount_paid" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"status" varchar(30) DEFAULT 'DRAFT' NOT NULL,
	"payment_channel" varchar(50),
	"payment_reference" varchar(100),
	"paid_at" timestamp,
	"attachment_url" text,
	"attachment_name" varchar(255),
	"attachment_size" integer,
	"source_po_id" uuid,
	"source_grn_id" uuid,
	"matching_status" varchar(30) DEFAULT 'UNMATCHED' NOT NULL,
	"price_variance_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"quantity_variance_count" numeric(12, 2) DEFAULT '0.00' NOT NULL,
	"variance_notes" text,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgets" DROP CONSTRAINT "unique_budget_account_period";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "attachment_url" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "attachment_name" varchar(255);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "attachment_size" integer;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "exchange_rate" numeric(12, 4) DEFAULT '1.0000' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "base_currency" varchar(3);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "base_grand_total" numeric(12, 2);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "client_portal_response" varchar(50);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "client_amendment_notes" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "email_delivery_status" varchar(50) DEFAULT 'NOT_SENT' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "resend_email_id" varchar(100);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "last_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "last_email_opened_at" timestamp;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "location_id" uuid;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "loyalty_points_earned" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "loyalty_points_redeemed" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "loyalty_discount_amount" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "user_id" uuid;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "department" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "designation" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "employment_type" "employment_type" DEFAULT 'FULL_TIME' NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_name" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_account_number" varchar(50);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_branch" varchar(100);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "mpesa_phone" varchar(30);--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "reference_number" varchar(100);--> statement-breakpoint
ALTER TABLE "journal_entries" ADD COLUMN "cost_center_id" uuid;--> statement-breakpoint
ALTER TABLE "shop_invitations" ADD COLUMN "assigned_location_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_invitations" ADD COLUMN "hide_cost_prices" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_invitations" ADD COLUMN "direct_approval_limit" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_members" ADD COLUMN "assigned_location_ids" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_members" ADD COLUMN "hide_cost_prices" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "shop_members" ADD COLUMN "direct_approval_limit" numeric(12, 2) DEFAULT '0.00' NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "auto_stock_deduction_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "business_mode" varchar(30) DEFAULT 'HYBRID' NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "loyalty_engine_mode" "loyalty_engine_mode" DEFAULT 'OFF' NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "plan" varchar(30) DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "subscription_status" varchar(30) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "is_lifetime_pro" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "is_suspended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "suspended_reason" text;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "shops" ADD COLUMN "grace_period_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "plan" varchar(30) DEFAULT 'FREE' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_status" varchar(30) DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "subscription_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "grace_period_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auto_renew_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "auto_renew_phone" varchar(30);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_renewal_prompt_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "is_lifetime_pro" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "approval_policies" ADD CONSTRAINT "approval_policies_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_policy_id_approval_policies_id_fk" FOREIGN KEY ("policy_id") REFERENCES "public"."approval_policies"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_requester_user_id_users_id_fk" FOREIGN KEY ("requester_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_requests" ADD CONSTRAINT "approval_requests_decision_by_user_id_users_id_fk" FOREIGN KEY ("decision_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_timeline" ADD CONSTRAINT "approval_timeline_request_id_approval_requests_id_fk" FOREIGN KEY ("request_id") REFERENCES "public"."approval_requests"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "approval_timeline" ADD CONSTRAINT "approval_timeline_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bill_of_materials" ADD CONSTRAINT "bill_of_materials_finished_product_id_products_id_fk" FOREIGN KEY ("finished_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "billing_transactions" ADD CONSTRAINT "billing_transactions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_bom_id_bill_of_materials_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bill_of_materials"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bom_items" ADD CONSTRAINT "bom_items_raw_material_product_id_products_id_fk" FOREIGN KEY ("raw_material_product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_loyalty_accounts" ADD CONSTRAINT "client_loyalty_accounts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_loyalty_accounts" ADD CONSTRAINT "client_loyalty_accounts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "client_loyalty_accounts" ADD CONSTRAINT "client_loyalty_accounts_tier_id_membership_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."membership_tiers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_hours_log" ADD CONSTRAINT "contract_hours_log_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_hours_log" ADD CONSTRAINT "contract_hours_log_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contract_hours_log" ADD CONSTRAINT "contract_hours_log_logged_by_user_id_users_id_fk" FOREIGN KEY ("logged_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cost_centers" ADD CONSTRAINT "cost_centers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_activities" ADD CONSTRAINT "deal_activities_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_activities" ADD CONSTRAINT "deal_activities_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deal_activities" ADD CONSTRAINT "deal_activities_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deals" ADD CONSTRAINT "deals_assigned_user_id_users_id_fk" FOREIGN KEY ("assigned_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_notes" ADD CONSTRAINT "document_notes_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_notes" ADD CONSTRAINT "document_notes_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_notes" ADD CONSTRAINT "document_notes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_payments" ADD CONSTRAINT "document_payments_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_payments" ADD CONSTRAINT "document_payments_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_payments" ADD CONSTRAINT "document_payments_recorded_by_user_id_users_id_fk" FOREIGN KEY ("recorded_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_cost_center_id_cost_centers_id_fk" FOREIGN KEY ("cost_center_id") REFERENCES "public"."cost_centers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_approved_by_id_users_id_fk" FOREIGN KEY ("approved_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_claims" ADD CONSTRAINT "expense_claims_disbursed_expense_id_expenses_id_fk" FOREIGN KEY ("disbursed_expense_id") REFERENCES "public"."expenses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_entities" ADD CONSTRAINT "group_entities_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_group_id_group_entities_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "group_memberships" ADD CONSTRAINT "group_memberships_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inter_company_transactions" ADD CONSTRAINT "inter_company_transactions_group_id_group_entities_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."group_entities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inter_company_transactions" ADD CONSTRAINT "inter_company_transactions_source_shop_id_shops_id_fk" FOREIGN KEY ("source_shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inter_company_transactions" ADD CONSTRAINT "inter_company_transactions_target_shop_id_shops_id_fk" FOREIGN KEY ("target_shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inter_company_transactions" ADD CONSTRAINT "inter_company_transactions_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inter_company_transactions" ADD CONSTRAINT "inter_company_transactions_target_bill_id_vendor_bills_id_fk" FOREIGN KEY ("target_bill_id") REFERENCES "public"."vendor_bills"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_account_id_client_loyalty_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."client_loyalty_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_source_document_id_documents_id_fk" FOREIGN KEY ("source_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_ledger" ADD CONSTRAINT "loyalty_ledger_created_by_id_users_id_fk" FOREIGN KEY ("created_by_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loyalty_programs" ADD CONSTRAINT "loyalty_programs_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "membership_tiers" ADD CONSTRAINT "membership_tiers_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_location_id_stock_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_bin_id_storage_bins_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."storage_bins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_batches" ADD CONSTRAINT "product_batches_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_bom_id_bill_of_materials_id_fk" FOREIGN KEY ("bom_id") REFERENCES "public"."bill_of_materials"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "production_orders" ADD CONSTRAINT "production_orders_target_location_id_stock_locations_id_fk" FOREIGN KEY ("target_location_id") REFERENCES "public"."stock_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_invoiced_document_id_documents_id_fk" FOREIGN KEY ("invoiced_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_contract_id_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."contracts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_items" ADD CONSTRAINT "proposal_items_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_tokens" ADD CONSTRAINT "proposal_tokens_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_deal_id_deals_id_fk" FOREIGN KEY ("deal_id") REFERENCES "public"."deals"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_converted_document_id_documents_id_fk" FOREIGN KEY ("converted_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shop_currencies" ADD CONSTRAINT "shop_currencies_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_stocktake_id_stocktakes_id_fk" FOREIGN KEY ("stocktake_id") REFERENCES "public"."stocktakes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_bin_id_storage_bins_id_fk" FOREIGN KEY ("bin_id") REFERENCES "public"."storage_bins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktake_items" ADD CONSTRAINT "stocktake_items_batch_id_product_batches_id_fk" FOREIGN KEY ("batch_id") REFERENCES "public"."product_batches"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_location_id_stock_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stocktakes" ADD CONSTRAINT "stocktakes_conducted_by_user_id_users_id_fk" FOREIGN KEY ("conducted_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_bins" ADD CONSTRAINT "storage_bins_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "storage_bins" ADD CONSTRAINT "storage_bins_location_id_stock_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timesheets" ADD CONSTRAINT "timesheets_invoiced_document_id_documents_id_fk" FOREIGN KEY ("invoiced_document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bill_items" ADD CONSTRAINT "vendor_bill_items_bill_id_vendor_bills_id_fk" FOREIGN KEY ("bill_id") REFERENCES "public"."vendor_bills"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bill_items" ADD CONSTRAINT "vendor_bill_items_account_id_chart_of_accounts_id_fk" FOREIGN KEY ("account_id") REFERENCES "public"."chart_of_accounts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_shop_id_shops_id_fk" FOREIGN KEY ("shop_id") REFERENCES "public"."shops"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_source_po_id_documents_id_fk" FOREIGN KEY ("source_po_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vendor_bills" ADD CONSTRAINT "vendor_bills_source_grn_id_documents_id_fk" FOREIGN KEY ("source_grn_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_approvals_shop_status" ON "approval_requests" USING btree ("shop_id","status");--> statement-breakpoint
CREATE INDEX "idx_approvals_requester" ON "approval_requests" USING btree ("requester_user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_shop_table" ON "audit_logs" USING btree ("shop_id","table_name");--> statement-breakpoint
CREATE INDEX "idx_audit_record" ON "audit_logs" USING btree ("record_id");--> statement-breakpoint
CREATE INDEX "idx_audit_user" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_shop_created" ON "audit_logs" USING btree ("shop_id","created_at");--> statement-breakpoint
CREATE INDEX "idx_bom_finished_product" ON "bill_of_materials" USING btree ("finished_product_id");--> statement-breakpoint
CREATE INDEX "idx_bom_items_bom" ON "bom_items" USING btree ("bom_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_shop" ON "contracts" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_contracts_status" ON "contracts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_contracts_next_billing" ON "contracts" USING btree ("next_billing_date");--> statement-breakpoint
CREATE INDEX "idx_deals_shop" ON "deals" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_deals_stage" ON "deals" USING btree ("stage");--> statement-breakpoint
CREATE INDEX "idx_deals_client" ON "deals" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_expense_claims_shop" ON "expense_claims" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_expense_claims_employee" ON "expense_claims" USING btree ("employee_id");--> statement-breakpoint
CREATE INDEX "idx_expense_claims_status" ON "expense_claims" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE INDEX "idx_notifications_shop" ON "notifications" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_batches_product" ON "product_batches" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "idx_batches_expiry" ON "product_batches" USING btree ("expiry_date");--> statement-breakpoint
CREATE INDEX "idx_batches_location" ON "product_batches" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_production_orders_shop" ON "production_orders" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_projects_shop" ON "projects" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_projects_client" ON "projects" USING btree ("client_id");--> statement-breakpoint
CREATE INDEX "idx_projects_status" ON "projects" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_proposal_token" ON "proposal_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_proposals_shop" ON "proposals" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_proposals_deal" ON "proposals" USING btree ("deal_id");--> statement-breakpoint
CREATE INDEX "idx_proposals_status" ON "proposals" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_stocktake_items_stocktake" ON "stocktake_items" USING btree ("stocktake_id");--> statement-breakpoint
CREATE INDEX "idx_stocktakes_shop" ON "stocktakes" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_storage_bins_location" ON "storage_bins" USING btree ("location_id");--> statement-breakpoint
CREATE INDEX "idx_timesheets_project" ON "timesheets" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "idx_timesheets_user" ON "timesheets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_timesheets_status" ON "timesheets" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_vendor_bills_shop" ON "vendor_bills" USING btree ("shop_id");--> statement-breakpoint
CREATE INDEX "idx_vendor_bills_supplier" ON "vendor_bills" USING btree ("supplier_id");--> statement-breakpoint
CREATE INDEX "idx_vendor_bills_status" ON "vendor_bills" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_vendor_bills_matching" ON "vendor_bills" USING btree ("matching_status");--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_location_id_stock_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."stock_locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "unique_shop_account_budget" UNIQUE("shop_id","account_id","month","year");