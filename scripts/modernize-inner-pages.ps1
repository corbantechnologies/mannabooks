# modernize-inner-pages.ps1
# Run from project root: powershell -ExecutionPolicy Bypass -File scripts/modernize-inner-pages.ps1

$root = "src/app/workspaces"
$files = Get-ChildItem -Path $root -Recurse -Include "*.tsx"

$replacements = @(
  # 1. Outer page wrapper - remove selection helpers, normalize spacing
  @{ P = 'p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white font-mono text-xs'; R = 'p-5 sm:p-7 space-y-6 font-mono text-xs'; Rx = $false }
  @{ P = 'p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white font-sans text-xs'; R = 'p-5 sm:p-7 space-y-6 font-sans text-xs'; Rx = $false }
  @{ P = 'p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white max-w-6xl mx-auto'; R = 'p-5 sm:p-7 space-y-6 max-w-6xl mx-auto'; Rx = $false }
  @{ P = 'p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-mono text-xs'; R = 'p-5 sm:p-7 space-y-6 font-mono text-xs'; Rx = $false }
  @{ P = 'p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white font-sans text-xs'; R = 'p-5 sm:p-7 space-y-6 font-sans text-xs'; Rx = $false }
  @{ P = 'p-4 sm:p-8 space-y-12 selection:bg-black selection:text-white'; R = 'p-5 sm:p-7 space-y-6'; Rx = $false }
  @{ P = 'p-4 sm:p-8 space-y-10 selection:bg-black selection:text-white'; R = 'p-5 sm:p-7 space-y-6'; Rx = $false }
  @{ P = 'p-4 sm:p-8 space-y-8 selection:bg-black selection:text-white'; R = 'p-5 sm:p-7 space-y-6'; Rx = $false }

  # 2. Page header border-b dividers - REMOVE them (use whitespace instead)
  @{ P = 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-200/80 pb-6'; R = 'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'; Rx = $false }
  @{ P = 'border-b border-zinc-200/80 pb-6 space-y-2'; R = 'space-y-2'; Rx = $false }
  @{ P = 'border-b border-zinc-200/80 pb-6 space-y-1'; R = 'space-y-1'; Rx = $false }
  @{ P = 'border-b border-zinc-200/80 pb-6 space-y-3'; R = 'space-y-3'; Rx = $false }
  @{ P = '"border-b border-zinc-200/80 pb-6"'; R = '"space-y-2"'; Rx = $false }

  # 3. Eyebrow label - normalize to non-caps
  @{ P = 'className="font-sans text-xs text-zinc-400 font-bold uppercase tracking-wider"'; R = 'className="text-xs text-zinc-400 font-medium"'; Rx = $false }
  @{ P = 'className="font-sans text-xs text-zinc-400 font-semibold uppercase tracking-wider"'; R = 'className="text-xs text-zinc-400 font-medium"'; Rx = $false }

  # 4. H1 page title - modern sizing, no uppercase
  @{ P = 'className="text-xl font-semibold uppercase tracking-tight mt-1 text-black font-sans"'; R = 'className="text-[22px] font-semibold text-zinc-900 mt-0.5 leading-tight"'; Rx = $false }

  # 5. Stat strip cards - remove colored left stripe
  @{ P = 'card-modern p-4 space-y-1 border-l-2 border-amber-400'; R = 'stat-card p-4 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-1 border-l-2 border-rose-400';  R = 'stat-card p-4 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-1 border-l-2 border-emerald-400'; R = 'stat-card p-4 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-1 border-l-2 border-blue-400'; R = 'stat-card p-4 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-1 border-l-2 border-zinc-300'; R = 'stat-card p-4 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-1 border-l-2 border-black'; R = 'stat-card p-4 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-1 border-l-2 border-purple-400'; R = 'stat-card p-4 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-1 border-l-2 border-violet-400'; R = 'stat-card p-4 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-2 border-l-2 border-amber-400'; R = 'stat-card p-4 space-y-2'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-2 border-l-2 border-emerald-400'; R = 'stat-card p-4 space-y-2'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-2 border-l-2 border-rose-400'; R = 'stat-card p-4 space-y-2'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-2 border-l-2 border-blue-400'; R = 'stat-card p-4 space-y-2'; Rx = $false }
  @{ P = 'card-modern p-4 space-y-2 border-l-2 border-zinc-400'; R = 'stat-card p-4 space-y-2'; Rx = $false }
  @{ P = 'card-modern p-3 space-y-1 border-l-2 border-emerald-400'; R = 'stat-card p-3 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-3 space-y-1 border-l-2 border-amber-400'; R = 'stat-card p-3 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-3 space-y-1 border-l-2 border-rose-400'; R = 'stat-card p-3 space-y-1'; Rx = $false }
  @{ P = 'card-modern p-3 space-y-1 border-l-2 border-blue-400'; R = 'stat-card p-3 space-y-1'; Rx = $false }

  # 6. Table wrapper - card-modern -> surface
  @{ P = 'className="card-modern overflow-x-auto"'; R = 'className="surface overflow-x-auto"'; Rx = $false }

  # 7. Table thead row
  @{ P = 'className="bg-zinc-50/80 border-b border-zinc-200 uppercase tracking-wider font-semibold text-zinc-600"'; R = 'className="border-b border-zinc-100 text-[10px] uppercase tracking-wide font-semibold text-zinc-400 bg-zinc-50/60"'; Rx = $false }

  # 8. Table th cells
  @{ P = '"p-4 border-r border-zinc-200"'; R = '"px-4 py-3 border-r border-zinc-100"'; Rx = $false }
  @{ P = '"p-4 border-r border-zinc-200 text-right"'; R = '"px-4 py-3 border-r border-zinc-100 text-right"'; Rx = $false }
  @{ P = '"p-4 border-r border-zinc-200 text-center"'; R = '"px-4 py-3 border-r border-zinc-100 text-center"'; Rx = $false }
  @{ P = '"p-4 border-r border-zinc-200 font-mono"'; R = '"px-4 py-3 border-r border-zinc-100"'; Rx = $false }
  @{ P = '"p-4 text-center"'; R = '"px-4 py-3 text-center"'; Rx = $false }

  # 9. Table body
  @{ P = 'className="divide-y divide-zinc-200/80 bg-white"'; R = 'className="bg-white"'; Rx = $false }

  # 10. Table rows
  @{ P = 'className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"'; R = 'className="hover:bg-zinc-50 transition-colors group cursor-pointer border-b border-zinc-100/80 last:border-0"'; Rx = $false }
  @{ P = 'className="hover:bg-zinc-50/80 transition-colors"'; R = 'className="hover:bg-zinc-50 transition-colors border-b border-zinc-100/80 last:border-0"'; Rx = $false }

  # 11. Table cell borders
  @{ P = 'border-r border-zinc-200/80'; R = 'border-r border-zinc-100'; Rx = $false }
  @{ P = 'border-b border-zinc-200/80'; R = 'border-b border-zinc-100'; Rx = $false }
  @{ P = 'border-b border-zinc-200'; R = 'border-b border-zinc-100'; Rx = $false }

  # 12. Stat label text
  @{ P = 'className="font-mono text-[10px] text-zinc-400 uppercase font-bold"'; R = 'className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wide"'; Rx = $false }

  # 13. Old document type inline badge
  @{ P = '"border border-zinc-200 px-1.5 py-0.5 text-[9px] font-semibold tracking-widest bg-zinc-50 rounded"'; R = '"badge-zinc"'; Rx = $false }

  # 14. Document status - old bespoke style to badge classes
  @{ P = '"bg-black text-white border-black"'; R = '"badge-emerald"'; Rx = $false }
  @{ P = '"bg-white text-black border-zinc-300 font-semibold"'; R = '"badge-zinc"'; Rx = $false }
  @{ P = '"bg-rose-50 border-rose-300 text-rose-700 font-semibold"'; R = '"badge-rose"'; Rx = $false }
  @{ P = '"bg-zinc-50 text-zinc-400 border-zinc-200"'; R = '"badge-zinc"'; Rx = $false }

  # 15. Section h2 headings inside pages
  @{ P = 'className="font-sans font-semibold uppercase tracking-tight text-sm text-black mt-0.5"'; R = 'className="text-[15px] font-semibold text-zinc-900 mt-0.5"'; Rx = $false }

  # 16. Table wrapper card-modern (without overflow)
  @{ P = 'className="card-modern"'; R = 'className="surface"'; Rx = $false }
)

$totalFiles = 0
$totalChanges = 0

foreach ($file in $files) {
  $content = Get-Content $file.FullName -Raw -Encoding UTF8
  $original = $content
  $fileChanges = 0

  foreach ($r in $replacements) {
    if ($r.Rx) {
      $newContent = [regex]::Replace($content, $r.P, $r.R)
    } else {
      $newContent = $content.Replace($r.P, $r.R)
    }
    if ($newContent -ne $content) {
      $fileChanges++
      $content = $newContent
    }
  }

  if ($content -ne $original) {
    Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
    Write-Host "Updated: $($file.Name) - $fileChanges replacements" -ForegroundColor Green
    $totalFiles++
    $totalChanges += $fileChanges
  }
}

Write-Host ""
Write-Host "Complete: $totalFiles files updated, $totalChanges replacement blocks applied." -ForegroundColor Cyan
