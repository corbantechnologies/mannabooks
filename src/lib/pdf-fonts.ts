import ReactPDF from "@react-pdf/renderer";

/**
 * Registers common web font-family stack names as aliases pointing to the
 * built-in Helvetica PostScript font that @react-pdf/renderer ships with.
 *
 * WHY THIS EXISTS:
 * @react-pdf/renderer is a PDF layout engine, not a browser. It cannot
 * auto-resolve CSS font stacks like 'Space Grotesk', 'Inter', system-ui, sans-serif.
 * When content from the database (terms, descriptions, shop data) contains
 * CSS font-family declarations, @react-pdf throws "Font family not registered".
 * We map all common web font names to Helvetica so they render cleanly.
 */

interface PdfFontEntry {
    src: string;
    fontStyle?: "normal" | "italic";
    fontWeight?: number | "normal" | "bold";
}

const BOLD_WEIGHTS = [600, 700, 800, 900];
const NORMAL_WEIGHTS = [100, 200, 300, 400, 500];

function makeHelveticaFonts(): PdfFontEntry[] {
    const fonts: PdfFontEntry[] = [];
    for (const w of NORMAL_WEIGHTS) {
        fonts.push({ src: "Helvetica", fontStyle: "normal", fontWeight: w });
        fonts.push({ src: "Helvetica-Oblique", fontStyle: "italic", fontWeight: w });
    }
    for (const w of BOLD_WEIGHTS) {
        fonts.push({ src: "Helvetica-Bold", fontStyle: "normal", fontWeight: w });
        fonts.push({ src: "Helvetica-BoldOblique", fontStyle: "italic", fontWeight: w });
    }
    fonts.push({ src: "Helvetica", fontStyle: "normal", fontWeight: "normal" });
    fonts.push({ src: "Helvetica-Bold", fontStyle: "normal", fontWeight: "bold" });
    fonts.push({ src: "Helvetica-Oblique", fontStyle: "italic", fontWeight: "normal" });
    fonts.push({ src: "Helvetica-BoldOblique", fontStyle: "italic", fontWeight: "bold" });
    return fonts;
}

// All font family names that could appear in database content or CSS stylesheets
// and must be resolvable by @react-pdf/renderer's font engine.
const WEB_FONT_ALIASES = [
    // Full CSS font stacks (appear verbatim as fontFamily when content is copy-pasted)
    "'Space Grotesk', 'Inter', system-ui, sans-serif",
    "Space Grotesk, Inter, system-ui, sans-serif",
    // Individual web font names
    "Space Grotesk",
    "Inter",
    "system-ui",
    "sans-serif",
    "serif",
    "monospace",
    // Google Fonts / project-specific names
    "Google Sans",
    "GoogleSans",
    // CSS variable-based font stacks (from Next.js/Tailwind projects)
    "var(--font-google-sans), sans-serif",
    "var(--font-sans)",
    "var(--font-mono)",
    "var(--font-heading)",
];

let _registered = false;

export function registerPdfFonts() {
    if (_registered) return;
    _registered = true;

    const helveticaFonts = makeHelveticaFonts();
    for (const alias of WEB_FONT_ALIASES) {
        ReactPDF.Font.register({ family: alias, fonts: helveticaFonts });
    }
    ReactPDF.Font.registerHyphenationCallback((word) => [word]);
}
