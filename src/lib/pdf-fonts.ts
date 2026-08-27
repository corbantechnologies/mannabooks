import ReactPDF from "@react-pdf/renderer";

/**
 * Universal PDF Font Fallback & Auto-Resolution Engine for @react-pdf/renderer
 *
 * WHY THIS IS CRITICAL:
 * @react-pdf/renderer is a PDF vector layout engine. It does not have browser-level
 * CSS font fallback. If any database entity (SVG logo, copy-pasted terms, HTML descriptions,
 * or custom workspace fonts) specifies an unregistered font-family or an unresolvable
 * font weight/style, the layout engine throws:
 *   - "Font family not registered: <family>"
 *   - "Could not resolve font for <family>, fontWeight <weight>, fontStyle <style>"
 *
 * This utility:
 * 1. Registers all common web font stacks as Helvetica aliases.
 * 2. Monkey-patches FontStore.getFont and FontFamily.prototype.resolve so that ANY
 *    unknown font or unresolved weight/style automatically falls back to Helvetica
 *    instead of throwing a 500 Server Engine Error.
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

const WEB_FONT_ALIASES = [
    "'Space Grotesk', 'Inter', system-ui, sans-serif",
    "Space Grotesk, Inter, system-ui, sans-serif",
    "'Space Grotesk', Inter, system-ui, sans-serif",
    "Space Grotesk",
    "Inter",
    "system-ui",
    "sans-serif",
    "serif",
    "monospace",
    "Google Sans",
    "GoogleSans",
    "var(--font-google-sans), sans-serif",
    "var(--font-sans)",
    "var(--font-mono)",
    "var(--font-heading)",
];

let _patched = false;

function applyGlobalFontFallback() {
    if (_patched) return;
    _patched = true;

    try {
        const fontStore: any = ReactPDF.Font;
        if (!fontStore) return;

        // 1. Patch FontFamily.prototype.resolve to never throw on weight/style mismatch
        const helveticaFamily = fontStore.fontFamilies?.["Helvetica"];
        const FontFamilyClass = helveticaFamily?.constructor;
        if (FontFamilyClass?.prototype?.resolve) {
            const origResolve = FontFamilyClass.prototype.resolve;
            FontFamilyClass.prototype.resolve = function (descriptor: any) {
                try {
                    return origResolve.call(this, descriptor);
                } catch {
                    // Fallback to any source in this family, or standard Helvetica
                    if (this.sources && this.sources.length > 0) {
                        const styleMatch = this.sources.find((s: any) => s.fontStyle === descriptor?.fontStyle);
                        return styleMatch || this.sources[0];
                    }
                    const globalHelvetica = fontStore.fontFamilies?.["Helvetica"];
                    return globalHelvetica?.sources?.[0] || null;
                }
            };
        }

        // 2. Patch FontStore.getFont to never throw on unregistered font families
        if (typeof fontStore.getFont === "function") {
            const origGetFont = fontStore.getFont.bind(fontStore);
            fontStore.getFont = function (descriptor: any) {
                try {
                    const family = descriptor?.fontFamily;
                    if (!this.fontFamilies?.[family]) {
                        // Unregistered font family -> delegate to Helvetica
                        const helvetica = this.fontFamilies?.["Helvetica"];
                        if (helvetica) {
                            return helvetica.resolve(descriptor);
                        }
                    }
                    return origGetFont(descriptor);
                } catch {
                    // Total safety fallback: return Helvetica source
                    const helvetica = this.fontFamilies?.["Helvetica"];
                    if (helvetica) {
                        try {
                            return helvetica.resolve(descriptor);
                        } catch {
                            return helvetica.sources?.[0] || null;
                        }
                    }
                    return null;
                }
            };
        }
    } catch (err) {
        console.warn("Failed to apply global PDF font fallback patch:", err);
    }
}

export function registerPdfFonts() {
    const helveticaFonts = makeHelveticaFonts();
    for (const alias of WEB_FONT_ALIASES) {
        ReactPDF.Font.register({ family: alias, fonts: helveticaFonts });
    }
    ReactPDF.Font.registerHyphenationCallback((word) => [word]);
    applyGlobalFontFallback();
}
