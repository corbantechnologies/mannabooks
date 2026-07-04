// src/app/workspaces/[slug]/guide/page.tsx
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";

interface WorkspaceGuidePageProps {
  params: Promise<{ slug: string }>;
}

export default async function WorkspaceGuidePage({ params }: WorkspaceGuidePageProps) {
  const { slug } = await params;

  const shop = await db.query.shops.findFirst({
    where: eq(shops.slug, slug),
  });

  if (!shop) notFound();

  return (
    <div className="p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs">
      
      {/* HEADER BAR */}
      <div className="border-b border-black pb-6 space-y-2">
        <span className="text-[10px] text-zinc-400 uppercase">DOCUMENTATION // IN_APP_OPERATOR_GUIDE</span>
        <h1 className="text-3xl font-bold uppercase tracking-tighter font-sans">{shop.name} Operator Manual</h1>
        <p className="font-sans text-xs text-zinc-600">
          Comprehensive step-by-step operating guide for managing billing ledgers, eTIMS tax returns, payment channels, and financial analytics.
        </p>
      </div>

      {/* MODULE CARDS */}
      <div className="grid grid-cols-1 gap-8 max-w-4xl">
        
        {/* MODULE 1 */}
        <div className="border border-black p-6 bg-white space-y-3">
          <div className="flex items-center gap-2 border-b border-black pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-bold uppercase text-[10px]">[01] SYSTEM SETTINGS &amp; BRAND THEMES</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Configure business profile parameters, VAT PIN, phone numbers, website, Cloudinary logo uploads, and custom shop theme colors.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/settings`}
              className="border border-black bg-zinc-50 px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-black hover:text-white transition-colors inline-block"
            >
              Go to System Settings -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 2 */}
        <div className="border border-black p-6 bg-white space-y-3">
          <div className="flex items-center gap-2 border-b border-black pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-bold uppercase text-[10px]">[02] CLIENT FLOW &amp; SUPPLIER NETWORK</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Register clients and suppliers with tax PINs for statutory eTIMS compliance. Generate invoices or LPOs directly from client/supplier detail pages.
          </p>
          <div className="flex gap-3 pt-2">
            <Link
              href={`/workspaces/${slug}/clients`}
              className="border border-black bg-zinc-50 px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-black hover:text-white transition-colors"
            >
              Go to Client Directory -&gt;
            </Link>
            <Link
              href={`/workspaces/${slug}/suppliers`}
              className="border border-black bg-zinc-50 px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-black hover:text-white transition-colors"
            >
              Go to Supplier Network -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 3 */}
        <div className="border border-black p-6 bg-white space-y-3">
          <div className="flex items-center gap-2 border-b border-black pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-bold uppercase text-[10px]">[03] FISCAL LEDGERS &amp; KRA eTIMS TAXES</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Issue Invoices, Receipts, Quotations, LPOs, and Credit Notes. Assign row-level tax rates (16% VAT, 0% Zero-Rated, Exempt) and enter eTIMS CU serial numbers.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/documents`}
              className="border border-black bg-zinc-50 px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-black hover:text-white transition-colors inline-block"
            >
              Go to Fiscal Ledgers -&gt;
            </Link>
          </div>
        </div>

        {/* MODULE 4 */}
        <div className="border border-black p-6 bg-white space-y-3">
          <div className="flex items-center gap-2 border-b border-black pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-bold uppercase text-[10px]">[04] PAYMENT CHANNELS &amp; REMITTANCE REF #</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            When settling documents, record payment destination channels (Bank, M-Pesa Till/Paybill, Cash, Cheque) and transaction reference codes (e.g. M-Pesa Code `QAB71239X` or Bank Ref).
          </p>
        </div>

        {/* MODULE 5 */}
        <div className="border border-black p-6 bg-white space-y-3">
          <div className="flex items-center gap-2 border-b border-black pb-2">
            <span className="bg-black text-white px-2 py-0.5 font-bold uppercase text-[10px]">[05] FINANCIAL INTELLIGENCE &amp; KRA 20TH VAT TRACKER</span>
          </div>
          <p className="font-sans text-xs text-zinc-600">
            Monitor real-time cash flow streams, 0–90+ day A/R aging risk matrix, top bestseller product velocity, and the statutory 20th KRA monthly VAT return deadline tracker.
          </p>
          <div className="pt-2">
            <Link
              href={`/workspaces/${slug}/analytics`}
              className="border border-black bg-zinc-50 px-3 py-1.5 font-bold uppercase text-[10px] hover:bg-black hover:text-white transition-colors inline-block"
            >
              Go to Financial Analytics -&gt;
            </Link>
          </div>
        </div>

      </div>

    </div>
  );
}
