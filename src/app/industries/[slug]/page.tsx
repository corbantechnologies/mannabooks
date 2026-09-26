// src/app/industries/[slug]/page.tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PublicNavbar } from "@/components/PublicNavbar";
import { INDUSTRIES_DATA, IndustryDetail } from "@/lib/data/industries";
import { USE_CASES_DATA } from "@/lib/data/use-cases";

interface IndustryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return INDUSTRIES_DATA.map((ind) => ({
    slug: ind.slug,
  }));
}

export async function generateMetadata({ params }: IndustryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const industry = INDUSTRIES_DATA.find((i) => i.slug === slug);
  if (!industry) return {};

  return {
    title: `${industry.heroTitle} | Manna Books Industries`,
    description: industry.heroSubtitle,
    keywords: [
      `${industry.tag.toLowerCase()} software Kenya`,
      `accounting software ${industry.slug} Kenya`,
      "KRA eTIMS accounting ERP Kenya",
      "Manna Books industry solutions",
    ],
    openGraph: {
      title: `${industry.heroTitle} — Manna Books`,
      description: industry.heroSubtitle,
      url: `https://mannabooks.co.ke/industries/${industry.slug}`,
      siteName: "Manna Books",
      locale: "en_KE",
      type: "website",
    },
    alternates: {
      canonical: `https://mannabooks.co.ke/industries/${industry.slug}`,
    },
  };
}

export default async function IndustryDetailPage({ params }: IndustryPageProps) {
  const { slug } = await params;
  const industry = INDUSTRIES_DATA.find((i) => i.slug === slug);
  if (!industry) notFound();

  // Find related cross-industry use cases
  const relatedUseCases = USE_CASES_DATA.filter(
    (uc) => uc.relatedIndustrySlug === industry.slug
  );

  return (
    <div className="flex-1 flex flex-col bg-white text-black selection:bg-black selection:text-white font-sans min-h-screen">
      <PublicNavbar />

      <main className="flex-1 flex flex-col">
        {/* ── BREADCRUMB & HERO ── */}
        <section className="relative overflow-hidden border-b border-zinc-200/80 px-5 sm:px-6 py-12 md:py-18 max-w-7xl mx-auto w-full">
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            aria-hidden="true"
            style={{
              backgroundImage:
                "linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)",
              backgroundSize: "36px 36px",
            }}
          />

          <div className="relative z-10 space-y-6">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-xs font-mono text-zinc-500 uppercase">
              <Link href="/industries" className="hover:text-black transition-colors font-semibold">
                ← All Industries
              </Link>
              <span>/</span>
              <span className="text-zinc-900 font-bold">{industry.tag}</span>
            </nav>

            <div className="flex flex-col lg:flex-row items-start justify-between gap-8 pt-2">
              <div className="space-y-4 max-w-3xl">
                <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-zinc-50 rounded-full font-bold text-zinc-700">
                  <span className="text-base">{industry.icon}</span>
                  <span>{industry.tag}</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight uppercase leading-tight text-zinc-950">
                  {industry.heroTitle}
                </h1>

                <p className="text-sm sm:text-base text-zinc-600 leading-relaxed max-w-2xl font-normal">
                  {industry.heroSubtitle}
                </p>
              </div>

              {/* Quick Action CTA Card */}
              <div className="lg:w-80 w-full border border-zinc-200 bg-zinc-50/80 p-5 rounded-2xl space-y-4 shrink-0 shadow-xs">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold block">
                    ● Ready for Kenya &amp; East Africa
                  </span>
                  <p className="text-xs text-zinc-600">
                    Pre-configured Chart of Accounts, KRA eTIMS integration &amp; local currency ledgers.
                  </p>
                </div>

                <div className="space-y-2">
                  <Link
                    href="/signup"
                    className="w-full text-center block bg-black text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-lg transition-colors font-mono"
                  >
                    Start 14-Day Free Workspace →
                  </Link>
                  <Link
                    href="/use-cases"
                    className="w-full text-center block border border-zinc-300 hover:bg-white text-zinc-800 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-colors font-mono"
                  >
                    Explore Real Use Cases
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── EXECUTIVE SUMMARY & TARGET PROFILES ── */}
        <section className="px-5 sm:px-6 py-12 max-w-7xl mx-auto w-full border-b border-zinc-100">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-6 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
                Executive Overview
              </span>
              <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-zinc-900">
                Why Standard Generic Accounting Systems Fail This Sector
              </h2>
              <p className="text-xs sm:text-sm text-zinc-600 leading-relaxed">
                {industry.executiveSummary}
              </p>
            </div>

            <div className="md:col-span-6 bg-zinc-50 border border-zinc-200/90 rounded-2xl p-6 space-y-3">
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold block">
                Target Business Profiles
              </span>
              <ul className="space-y-2">
                {industry.idealFor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-800 font-medium">
                    <span className="text-emerald-600 font-bold font-mono">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── PAIN POINTS VS. MANNABOOKS SOLUTIONS ── */}
        <section className="px-5 sm:px-6 py-16 max-w-7xl mx-auto w-full border-b border-zinc-100 space-y-10">
          <div className="space-y-2 text-center max-w-2xl mx-auto">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              The Operational Comparison
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900">
              Industry Bottlenecks vs. The MannaBooks Way
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {industry.keyChallenges.map((challenge, idx) => {
              const sol = industry.mannaSolution[idx] || industry.mannaSolution[0];
              return (
                <div
                  key={idx}
                  className="border border-zinc-200 rounded-2xl p-5 sm:p-6 bg-white flex flex-col justify-between space-y-5 shadow-xs hover:border-black transition-all"
                >
                  <div className="space-y-3">
                    <div className="inline-block bg-rose-50 text-rose-700 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full">
                      The Pain Point
                    </div>
                    <h3 className="font-bold text-sm text-zinc-950 uppercase">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {challenge.description}
                    </p>
                  </div>

                  <div className="border-t border-zinc-100 pt-4 space-y-3 bg-zinc-50/60 -mx-5 sm:-mx-6 -mb-5 sm:-mb-6 p-5 sm:p-6 rounded-b-2xl">
                    <div className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded-full">
                      MannaBooks Architecture
                    </div>
                    <h4 className="font-bold text-xs text-zinc-900 uppercase">
                      {sol.title}
                    </h4>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      {sol.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {sol.modules.map((mod, mIdx) => (
                        <span
                          key={mIdx}
                          className="bg-white border border-zinc-200 text-zinc-700 text-[9px] font-mono font-semibold px-2 py-0.5 rounded"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── STEP-BY-STEP OPERATIONAL FLOW ── */}
        <section className="px-5 sm:px-6 py-16 max-w-7xl mx-auto w-full border-b border-zinc-100 space-y-10">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              Standard Operating Procedure
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900">
              The End-to-End Operational Lifecycle
            </h2>
            <p className="text-xs text-zinc-500">
              How transactions, inventories, and entries move from inception to audited statutory reports.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {industry.workflowSteps.map((ws, idx) => (
              <div
                key={idx}
                className="border border-zinc-200 bg-white p-5 rounded-2xl space-y-3 relative flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xl font-bold text-zinc-300">
                      {ws.stepNumber}
                    </span>
                    <span className="w-2 h-2 rounded-full bg-black" />
                  </div>
                  <h3 className="font-bold text-xs uppercase text-zinc-950">
                    {ws.title}
                  </h3>
                  <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                    {ws.action}
                  </p>
                </div>

                <div className="border-t border-zinc-100 pt-2 text-[10px] font-mono text-emerald-800 bg-emerald-50/50 p-2 rounded-lg">
                  <span className="font-bold block uppercase text-[9px] text-emerald-900">GL Accounting Effect:</span>
                  {ws.accountingImpact}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SAMPLE GENERAL LEDGER TABLE ── */}
        <section className="px-5 sm:px-6 py-16 max-w-7xl mx-auto w-full border-b border-zinc-100 space-y-8">
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              Accounting Precision
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900">
              Sample Double-Entry Ledger Entries (KES)
            </h2>
            <p className="text-xs text-zinc-500">
              Every action in MannaBooks creates balanced, audit-ready debit and credit entries compliant with IFRS and KRA.
            </p>
          </div>

          <div className="border border-zinc-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-700 uppercase tracking-wider text-[10px] font-bold">
                    <th className="p-3.5 border-r border-zinc-200">Lifecycle Stage</th>
                    <th className="p-3.5 border-r border-zinc-200">Debit (Asset / Expense)</th>
                    <th className="p-3.5 border-r border-zinc-200">Credit (Liability / Revenue)</th>
                    <th className="p-3.5 border-r border-zinc-200 text-right">Amount (KES)</th>
                    <th className="p-3.5">Commercial Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 bg-white">
                  {industry.sampleLedger.map((row, idx) => (
                    <tr key={idx} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="p-3.5 border-r border-zinc-100 font-bold text-zinc-900">
                        {row.stage}
                      </td>
                      <td className="p-3.5 border-r border-zinc-100 text-emerald-700 font-semibold">
                        {row.debitAccount}
                      </td>
                      <td className="p-3.5 border-r border-zinc-100 text-rose-700 font-semibold">
                        {row.creditAccount}
                      </td>
                      <td className="p-3.5 border-r border-zinc-100 text-right font-bold text-zinc-950">
                        KES {row.amountKes}
                      </td>
                      <td className="p-3.5 font-sans text-zinc-600 text-xs">
                        {row.explanation}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* ── REAL-WORLD CASE STUDY FEATURE ── */}
        <section className="px-5 sm:px-6 py-16 max-w-7xl mx-auto w-full border-b border-zinc-100">
          <div className="border border-zinc-300 rounded-3xl p-6 sm:p-10 bg-zinc-950 text-white space-y-8 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
                  ★ Verified Client Case Study
                </span>
                <h3 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-white mt-1">
                  {industry.caseStudy.clientName}
                </h3>
                <p className="text-xs text-zinc-400 font-mono">
                  {industry.caseStudy.location} &bull; {industry.caseStudy.profile}
                </p>
              </div>

              <div className="px-3.5 py-1.5 bg-zinc-900 border border-zinc-700 rounded-full font-mono text-[11px] font-bold text-zinc-300">
                Industry: {industry.tag}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase text-rose-400 tracking-wider">
                  The Specific Challenge:
                </h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                  {industry.caseStudy.challenge}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-mono font-bold uppercase text-emerald-400 tracking-wider">
                  The MannaBooks Solution:
                </h4>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed font-sans">
                  {industry.caseStudy.solutionApplied}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-800 pt-6 space-y-3">
              <h4 className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                Measurable Business Outcomes:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {industry.caseStudy.measurableResults.map((res, rIdx) => (
                  <div
                    key={rIdx}
                    className="bg-zinc-900/90 border border-zinc-800 p-4 rounded-xl space-y-1"
                  >
                    <span className="text-emerald-400 font-mono text-lg font-bold">✓</span>
                    <p className="text-xs text-zinc-200 font-medium font-sans">
                      {res}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── RELATED CROSS-INDUSTRY USE CASES ── */}
        {relatedUseCases.length > 0 && (
          <section className="px-5 sm:px-6 py-16 max-w-7xl mx-auto w-full border-b border-zinc-100 space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
                  Field Scenarios
                </span>
                <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-zinc-900">
                  Featured Use Cases for {industry.tag}
                </h2>
              </div>
              <Link
                href="/use-cases"
                className="text-xs font-mono font-bold uppercase tracking-wider text-black hover:underline"
              >
                View All Scenarios →
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedUseCases.map((uc) => (
                <div
                  key={uc.id}
                  className="border border-zinc-200 rounded-2xl p-6 bg-zinc-50/50 space-y-4 hover:border-black transition-all"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{uc.icon}</span>
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full bg-white border border-zinc-200 text-zinc-700">
                      {uc.categoryLabel}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-sm uppercase text-black">
                      {uc.title}
                    </h3>
                    <p className="text-xs text-zinc-600 mt-1 font-sans">
                      {uc.headline}
                    </p>
                  </div>

                  <div className="border-t border-zinc-200/80 pt-3 flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-emerald-700">
                      {uc.roiMetric.headline}
                    </span>
                    <Link
                      href="/use-cases"
                      className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-800 hover:text-black hover:underline"
                    >
                      Read Breakdown →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FAQS ACCORDION ── */}
        <section className="px-5 sm:px-6 py-16 max-w-4xl mx-auto w-full border-b border-zinc-100 space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold uppercase tracking-tight text-zinc-900">
              Sector Technical Queries
            </h2>
          </div>

          <div className="space-y-4">
            {industry.faqs.map((faq, fIdx) => (
              <div
                key={fIdx}
                className="border border-zinc-200 rounded-2xl p-5 bg-white space-y-2 shadow-2xs"
              >
                <h3 className="font-bold text-xs uppercase text-zinc-950 font-mono">
                  Q: {faq.question}
                </h3>
                <p className="text-xs text-zinc-600 leading-relaxed font-sans">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── CONVERSION CTA ── */}
        <section className="px-5 sm:px-6 py-20 max-w-5xl mx-auto w-full text-center space-y-6">
          <div className="inline-flex items-center gap-2 border border-zinc-300 px-3 py-1 text-[11px] font-mono uppercase tracking-widest bg-zinc-50 rounded-full font-bold text-zinc-700">
            <span>● Deploy Your Industry Workspace</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold uppercase tracking-tight text-black max-w-3xl mx-auto">
            Ready to streamline your {industry.tag.toLowerCase()} operations?
          </h2>

          <p className="text-sm text-zinc-600 max-w-xl mx-auto">
            Start a free 14-day full-featured workspace. No credit card required. Compliant with KRA eTIMS, progressive payroll, and double-entry general ledger.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/signup"
              className="bg-black text-white hover:bg-zinc-800 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg font-mono transition-colors shadow-sm w-full sm:w-auto"
            >
              Get Started Free →
            </Link>
            <Link
              href="/contact"
              className="border border-zinc-300 hover:bg-zinc-50 text-zinc-800 text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-lg font-mono transition-colors w-full sm:w-auto"
            >
              Speak to a Consultant
            </Link>
          </div>
        </section>
      </main>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-200 bg-zinc-50 py-10 px-5 sm:px-6 text-xs text-zinc-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Manna Books Technologies. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/industries" className="hover:text-black">All Industries</Link>
            <Link href="/use-cases" className="hover:text-black">Use Cases</Link>
            <Link href="/features" className="hover:text-black">Features</Link>
            <Link href="/privacy" className="hover:text-black">Privacy</Link>
            <Link href="/terms" className="hover:text-black">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
