#!/usr/bin/env node
// scripts/modernize-inner-pages.mjs
// Run: node scripts/modernize-inner-pages.mjs

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..", "src", "app", "workspaces");

// Collect all .tsx files recursively
function walkTsx(dir) {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) results = results.concat(walkTsx(full));
    else if (entry.name.endsWith(".tsx")) results.push(full);
  }
  return results;
}

const files = walkTsx(root);

// All replacements — [pattern, replacement] string pairs
const replacements = [
  // ── 1. Outer page wrapper ──────────────────────────────────────────────
  ["p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white font-mono text-xs",  "p-5 sm:p-7 space-y-6 font-mono text-xs"],
  ["p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white font-sans text-xs",  "p-5 sm:p-7 space-y-6 font-sans text-xs"],
  ["p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white max-w-6xl mx-auto",  "p-5 sm:p-7 space-y-6 max-w-6xl mx-auto"],
  ["p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs", "p-5 sm:p-7 space-y-6 font-mono text-xs"],
  ["p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-sans text-xs", "p-5 sm:p-7 space-y-6 font-sans text-xs"],
  ["p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white", "p-5 sm:p-7 space-y-6"],
  ["p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white", "p-5 sm:p-7 space-y-6"],
  ["p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white",  "p-5 sm:p-7 space-y-6"],

  // ── 2. Page header border-b dividers ──────────────────────────────────
  ["flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6",
   "flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"],
  ["border-b border-zinc-200/80 pb-6 space-y-2", "space-y-2"],
  ["border-b border-zinc-200/80 pb-6 space-y-1", "space-y-1"],
  ["border-b border-zinc-200/80 pb-6 space-y-3", "space-y-3"],
  ['"border-b border-zinc-200/80 pb-6"', '"space-y-2"'],

  // ── 3. Eyebrow labels ─────────────────────────────────────────────────
  ['className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider"',
   'className="text-xs text-zinc-400 font-medium"'],
  ['className="font-sans text-xs text-zinc-400 font-semibold uppercase tracking-wider"',
   'className="text-xs text-zinc-400 font-medium"'],

  // ── 4. H1 page title ─────────────────────────────────────────────────
  ['className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans"',
   'className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight"'],

  // ── 5. Stat strip cards — remove colored stripes ──────────────────────
  ...["amber-400","rose-400","emerald-400","blue-400","zinc-300","zinc-400","black","purple-400","violet-400"].flatMap(c => [
    [`card-modern p-4 space-y-1 border-l-2 border-${c}`, "stat-card p-4 space-y-1"],
    [`card-modern p-4 space-y-2 border-l-2 border-${c}`, "stat-card p-4 space-y-2"],
    [`card-modern p-3 space-y-1 border-l-2 border-${c}`, "stat-card p-3 space-y-1"],
    [`card-modern p-5 space-y-2 border-l-2 border-${c}`, "stat-card p-5 space-y-2"],
  ]),

  // ── 6. Table wrapper ─────────────────────────────────────────────────
  ['className="card-modern overflow-x-auto"', 'className="surface overflow-x-auto"'],
  ['className="card-modern"',                 'className="surface"'],

  // ── 7. Table thead ───────────────────────────────────────────────────
  ['className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600"',
   'className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60"'],

  // ── 8. Table th cells ────────────────────────────────────────────────
  ['"p-4 border-r border-zinc-200"',          '"px-4 py-3 border-r border-zinc-100"'],
  ['"p-4 border-r border-zinc-200 text-right"', '"px-4 py-3 border-r border-zinc-100 text-right"'],
  ['"p-4 border-r border-zinc-200 text-center"', '"px-4 py-3 border-r border-zinc-100 text-center"'],
  ['"p-4 border-r border-zinc-200 font-mono"', '"px-4 py-3 border-r border-zinc-100"'],
  ['"p-4 text-center"', '"px-4 py-3 text-center"'],

  // ── 9. Table body ────────────────────────────────────────────────────
  ['className="divide-y divide-zinc-200/80 bg-white"', 'className="bg-white"'],
  ['className="divide-y divide-zinc-100 bg-white"',    'className="bg-white"'],

  // ── 10. Table row hover ──────────────────────────────────────────────
  ['className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"',
   'className="hover:bg-zinc-50 transition-colors group cursor-pointer border-b border-zinc-100/80 last:border-0"'],
  ['className="hover:bg-zinc-50/80 transition-colors"',
   'className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0"'],

  // ── 11. Cell borders ─────────────────────────────────────────────────
  ["border-r border-zinc-200/80", "border-r border-zinc-100"],
  ["border-b border-zinc-200/80", "border-b border-zinc-100"],
  ["border-b border-zinc-200",    "border-b border-zinc-100"],

  // ── 12. Stat label mono ──────────────────────────────────────────────
  ['className="font-mono text-[10px] text-zinc-400 uppercase font-bold"',
   'className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide"'],

  // ── 13. Inline doc-type badge ────────────────────────────────────────
  ['"border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold tracking-widest bg-zinc-50 rounded"',
   '"badge-zinc"'],

  // ── 14. Doc status badge colours → badge-* utilities ─────────────────
  ['"bg-black text-white border-black"',           '"badge-emerald"'],
  ['"bg-white text-black border-zinc-300 font-semibold"', '"badge-zinc"'],
  ['"bg-rose-50 border-rose-300 text-rose-700 font-semibold"', '"badge-rose"'],
  ['"bg-zinc-50 text-zinc-400 border-zinc-200"',   '"badge-zinc"'],

  // ── 15. Section h2 inside pages ──────────────────────────────────────
  ['className="font-sans font-semibold uppercase tracking-tight text-sm text-black mt-0.5"',
   'className="text-[15px] font-semibold text-zinc-900 mt-0.5"'],
  ['className="font-sans font-semibold uppercase tracking-tight text-sm text-black"',
   'className="text-[15px] font-semibold text-zinc-900"'],

  // ── 16. Table cell p-4 → px-4 py-3 for td cells ──────────────────────
  // Only broad cell padding that isn't already replaced
  ['"p-4 border-r border-zinc-100 font-semibold uppercase text-black"',
   '"px-4 py-3 border-r border-zinc-100 font-semibold text-zinc-900"'],
  ['"p-4 border-r border-zinc-100 font-sans text-sm font-semibold uppercase tracking-tight text-black"',
   '"px-4 py-3 border-r border-zinc-100 font-sans text-sm font-semibold text-zinc-900"'],
  ['"p-4 border-r border-zinc-100 font-sans text-sm font-semibold uppercase tracking-tight text-zinc-900"',
   '"px-4 py-3 border-r border-zinc-100 font-sans text-sm font-semibold text-zinc-900"'],
  ['"p-4 border-r border-zinc-100 text-zinc-500"',
   '"px-4 py-3 border-r border-zinc-100 text-zinc-400"'],
  ['"p-4 border-r border-zinc-100 font-semibold text-sm text-black text-right"',
   '"px-4 py-3 border-r border-zinc-100 font-semibold text-sm text-zinc-900 text-right"'],
  ['"p-4 border-r border-zinc-100 text-center"',
   '"px-4 py-3 border-r border-zinc-100 text-center"'],
  ['"p-4 text-center"', '"px-4 py-3 text-center"'],

  // ── 17. Empty state emoji ─────────────────────────────────────────────
  // Remove old emoji empty state divs
  ['<div className="text-4xl">📋</div>', '<div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center mx-auto mb-3"><svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"20\\" height=\\"20\\" viewBox=\\"0 0 24 24\\" fill=\\"none\\" stroke=\\"currentColor\\" strokeWidth=\\"1.5\\" strokeLinecap=\\"round\\" strokeLinejoin=\\"round\\"><path d=\\"M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z\\"/><polyline points=\\"14 2 14 8 20 8\\"/></svg></div>'],
];

let totalFiles = 0;
let totalChanges = 0;

for (const filePath of files) {
  let content = fs.readFileSync(filePath, "utf8");
  const original = content;
  let fileChanges = 0;

  for (const [pattern, replacement] of replacements) {
    if (content.includes(pattern)) {
      content = content.split(pattern).join(replacement);
      fileChanges++;
    }
  }

  if (content !== original) {
    fs.writeFileSync(filePath, content, "utf8");
    const rel = path.relative(path.join(__dirname, ".."), filePath);
    console.log(`Updated [${fileChanges}]: ${rel}`);
    totalFiles++;
    totalChanges += fileChanges;
  }
}

console.log(`\nDone: ${totalFiles} files, ${totalChanges} replacement blocks.`);
