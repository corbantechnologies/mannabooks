// src/app/portal/pdf/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documentTokens, documents, paymentMethods } from "@/db/schema";
import { eq } from "drizzle-orm";
import ReactPDF from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import React from "react";
import QRCode from "qrcode";
import path from "path";

// Register custom and fallback fonts for ReactPDF
try {
    const regularFont = path.join(process.cwd(), "public", "fonts", "static", "GoogleSans-Regular.ttf");
    const boldFont = path.join(process.cwd(), "public", "fonts", "static", "GoogleSans-Bold.ttf");
    const italicFont = path.join(process.cwd(), "public", "fonts", "static", "GoogleSans-Italic.ttf");

    const fontConfig = [
        { src: regularFont, fontWeight: 400, fontStyle: "normal" as const },
        { src: boldFont, fontWeight: 700, fontStyle: "normal" as const },
        { src: regularFont, fontWeight: "normal" as const, fontStyle: "normal" as const },
        { src: boldFont, fontWeight: "bold" as const, fontStyle: "normal" as const },
        { src: italicFont, fontWeight: 400, fontStyle: "italic" as const },
        { src: italicFont, fontWeight: "normal" as const, fontStyle: "italic" as const },
        { src: boldFont, fontWeight: 700, fontStyle: "italic" as const },
        { src: boldFont, fontWeight: "bold" as const, fontStyle: "italic" as const },
    ];

    ReactPDF.Font.register({
        family: "GoogleSans",
        fonts: fontConfig,
    });

    const fontAliases = [
        "'Space Grotesk', 'Inter', system-ui, sans-serif",
        "Space Grotesk",
        "Inter",
        "system-ui",
        "sans-serif",
        "Google Sans",
        "var(--font-google-sans), sans-serif",
    ];

    for (const alias of fontAliases) {
        ReactPDF.Font.register({
            family: alias,
            fonts: fontConfig,
        });
    }

    ReactPDF.Font.registerHyphenationCallback((word) => [word]);
} catch (e) {
    console.warn("Font registration warning:", e);
}

function parsePayrollDescription(description: string, fallbackUnitPrice: string) {
    const staffMatch = description.match(/Staff:\s*([^|]+)/i);
    const baseMatch = description.match(/Base:\s*([\d.]+)/i);
    const allowMatch = description.match(/Allow:\s*([\d.]+)/i);
    const commMatch = description.match(/Comm:\s*([\d.]+)/i);
    const payeMatch = description.match(/PAYE:\s*([\d.]+)/i);
    const shifMatch = description.match(/SHIF:\s*([\d.]+)/i);
    const ahlMatch = description.match(/AHL:\s*([\d.]+)/i);
    const nssfMatch = description.match(/NSSF:\s*([\d.]+)/i);
    const advMatch = description.match(/Adv:\s*([\d.]+)/i);
    const netMatch = description.match(/Net:\s*([\d.]+)/i);

    const name = staffMatch ? staffMatch[1].trim() : description;
    const base = baseMatch ? parseFloat(baseMatch[1]) : 0;
    const allow = allowMatch ? parseFloat(allowMatch[1]) : 0;
    const comm = commMatch ? parseFloat(commMatch[1]) : 0;
    const gross = base + allow + comm;
    const paye = payeMatch ? parseFloat(payeMatch[1]) : 0;
    const shif = shifMatch ? parseFloat(shifMatch[1]) : 0;
    const ahl = ahlMatch ? parseFloat(ahlMatch[1]) : 0;
    const nssf = nssfMatch ? parseFloat(nssfMatch[1]) : 0;
    const adv = advMatch ? parseFloat(advMatch[1]) : 0;
    const net = netMatch ? parseFloat(netMatch[1]) : (parseFloat(fallbackUnitPrice) || gross);

    return { name, base, allow, comm, gross, paye, shif, ahl, nssf, adv, net };
}

// Dedicated Landscape Layout for Statutory Payroll Vouchers
const PayrollPdfDocumentStructure = ({ doc, shop, qrCodeDataUrl }: any) => {
    const primaryColor = shop.primaryColor || "#047857";

    const styles = ReactPDF.StyleSheet.create({
        page: { padding: 28, backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 8, color: "#000000" },
        header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1.5, borderBottomColor: "#e4e4e7", paddingBottom: 14, marginBottom: 14 },
        logoContainer: { width: "52%", flexDirection: "row", alignItems: "flex-start", gap: 8 },
        logoImage: { width: 40, height: 40, objectFit: "contain" },
        shopDetails: { flex: 1 },
        headerRight: { width: "45%", alignItems: "flex-end" },
        shopName: { fontSize: 13, fontWeight: "bold", textTransform: "uppercase", color: primaryColor, marginBottom: 2 },
        typeBadge: { backgroundColor: primaryColor, color: "#ffffff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, fontSize: 7, fontWeight: "bold", textTransform: "uppercase", alignSelf: "flex-end" },
        docSerial: { fontSize: 11, fontWeight: "bold", color: primaryColor, marginTop: 2, textAlign: "right" },
        metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, backgroundColor: "#f8fafc", padding: 8, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 3 },
        metaCol: { width: "48%" },
        metaLabel: { color: "#64748b", fontSize: 7, fontWeight: "bold", marginBottom: 2, textTransform: "uppercase" },
        metaVal: { fontSize: 9, fontWeight: "bold" },
        tableHeader: { flexDirection: "row", backgroundColor: primaryColor, paddingVertical: 4, paddingHorizontal: 4, fontWeight: "bold", color: "#ffffff", fontSize: 6.8, alignItems: "center" },
        tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingVertical: 4, paddingHorizontal: 4, alignItems: "center", fontSize: 6.8 },
        colName: { width: "20%" },
        colBase: { width: "8%", textAlign: "right" },
        colAllow: { width: "8%", textAlign: "right" },
        colComm: { width: "8%", textAlign: "right" },
        colGross: { width: "9%", textAlign: "right", fontWeight: "bold" },
        colPaye: { width: "8%", textAlign: "right", color: "#b91c1c" },
        colShif: { width: "7%", textAlign: "right", color: "#b91c1c" },
        colAhl: { width: "7%", textAlign: "right", color: "#b91c1c" },
        colNssf: { width: "7%", textAlign: "right", color: "#b91c1c" },
        colAdv: { width: "8%", textAlign: "right", color: "#b91c1c" },
        colNet: { width: "10%", textAlign: "right", fontWeight: "bold", color: "#047857" },
        footerSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 14 },
        settleBox: { width: "55%", padding: 6, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderLeftWidth: 3, borderLeftColor: primaryColor, borderRadius: 2 },
        totalBox: { width: "40%", padding: 6, borderWidth: 1, borderColor: primaryColor, backgroundColor: "#ffffff", borderRadius: 2 },
        totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1 },
        grandTotalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: primaryColor, paddingTop: 3, marginTop: 2, fontWeight: "bold", fontSize: 8.5 },
        legalFooter: { marginTop: 16, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#e4e4e7", textAlign: "center", color: "#94a3b8", fontSize: 7 }
    });

    const shopDetailsChildren = [
        React.createElement(ReactPDF.Text, { key: "name", style: styles.shopName }, shop.shortName || shop.name),
        shop.taxPin ? React.createElement(ReactPDF.Text, { key: "pin", style: { fontSize: 7.5, color: "#475569" } }, "Tax PIN: " + shop.taxPin) : null,
        shop.phone ? React.createElement(ReactPDF.Text, { key: "phone", style: { fontSize: 7.5, color: "#475569" } }, "Tel: " + shop.phone) : null,
        shop.website ? React.createElement(ReactPDF.Text, { key: "web", style: { fontSize: 7.5, color: primaryColor } }, shop.website) : null,
        React.createElement(ReactPDF.Text, { key: "sub", style: { fontSize: 6.5, color: "#94a3b8", fontStyle: "italic", marginTop: 1 } }, "origin: secure statutory payroll channel")
    ].filter(Boolean);

    const logoContainerChildren = [
        shop.logoUrl ? React.createElement(ReactPDF.Image, { key: "logo", src: shop.logoUrl, style: styles.logoImage }) : null,
        React.createElement(ReactPDF.View, { key: "details", style: styles.shopDetails }, ...shopDetailsChildren)
    ].filter(Boolean);

    return React.createElement(
        ReactPDF.Document,
        null,
        React.createElement(
            ReactPDF.Page,
            { size: "A4", orientation: "landscape", style: styles.page },
            
            // Header
            React.createElement(
                ReactPDF.View,
                { style: styles.header },
                React.createElement(ReactPDF.View, { style: styles.logoContainer }, ...logoContainerChildren),
                React.createElement(
                    ReactPDF.View,
                    { style: styles.headerRight },
                    React.createElement(ReactPDF.Text, { style: styles.typeBadge }, "PAYROLL VOUCHER SNAPSHOT"),
                    React.createElement(ReactPDF.Text, { style: styles.docSerial }, doc.docNumber),
                    React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 7.5, color: "#64748b", marginTop: 2 } }, "Issued: " + new Date(doc.issueDate).toLocaleDateString("en-KE")),
                    React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 7.5, fontWeight: "bold", color: doc.status === "PAID" ? "#047857" : "#d97706", marginTop: 1 } }, `Status: ${doc.status}`)
                )
            ),

            // Metadata Row
            React.createElement(
                ReactPDF.View,
                { style: styles.metaRow },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.metaCol },
                    React.createElement(ReactPDF.Text, { style: styles.metaLabel }, "COMPANY REMUNERATION LEDGER:"),
                    React.createElement(ReactPDF.Text, { style: styles.metaVal }, shop.name),
                    React.createElement(ReactPDF.Text, null, "Internal Staff Payroll Allocation & Statutory Reserves Record"),
                    shop.phone ? React.createElement(ReactPDF.Text, null, "Tel: " + shop.phone) : null,
                    shop.taxPin ? React.createElement(ReactPDF.Text, null, "Tax PIN: " + shop.taxPin.toUpperCase()) : null
                ),
                React.createElement(
                    ReactPDF.View,
                    { style: { ...styles.metaCol, textAlign: "right" } },
                    React.createElement(ReactPDF.Text, { style: styles.metaLabel }, "LEDGER SUMMARY:"),
                    React.createElement(ReactPDF.Text, { style: styles.metaVal }, `Total Staff Entries: ${doc.items.length}`),
                    React.createElement(ReactPDF.Text, { style: { marginTop: 2, fontSize: 7.5, color: "#475569" } }, "Currency: " + shop.currency)
                )
            ),

            // Table Header
            React.createElement(
                ReactPDF.View,
                { style: styles.tableHeader },
                React.createElement(ReactPDF.Text, { style: styles.colName }, "STAFF MEMBER NAME"),
                React.createElement(ReactPDF.Text, { style: styles.colBase }, "BASE PAY"),
                React.createElement(ReactPDF.Text, { style: styles.colAllow }, "ALLOW"),
                React.createElement(ReactPDF.Text, { style: styles.colComm }, "COMM"),
                React.createElement(ReactPDF.Text, { style: styles.colGross }, "GROSS"),
                React.createElement(ReactPDF.Text, { style: styles.colPaye }, "PAYE"),
                React.createElement(ReactPDF.Text, { style: styles.colShif }, "SHIF"),
                React.createElement(ReactPDF.Text, { style: styles.colAhl }, "AHL"),
                React.createElement(ReactPDF.Text, { style: styles.colNssf }, "NSSF"),
                React.createElement(ReactPDF.Text, { style: styles.colAdv }, "ADV/DED"),
                React.createElement(ReactPDF.Text, { style: styles.colNet }, "NET OUTFLOW")
            ),

            // Table Body
            React.createElement(
                ReactPDF.View,
                { style: { width: "100%" } },
                doc.items.map((item: any, idx: number) => {
                    const parsed = parsePayrollDescription(item.description, item.unitPrice);
                    const isEven = idx % 2 === 0;

                    return React.createElement(
                        ReactPDF.View,
                        { key: item.id, style: { ...styles.tableRow, backgroundColor: isEven ? "#ffffff" : "#f8fafc" } },
                        React.createElement(ReactPDF.Text, { style: styles.colName }, parsed.name),
                        React.createElement(ReactPDF.Text, { style: styles.colBase }, formatCurrency(parsed.base, shop.currency)),
                        React.createElement(ReactPDF.Text, { style: styles.colAllow }, formatCurrency(parsed.allow, shop.currency)),
                        React.createElement(ReactPDF.Text, { style: styles.colComm }, formatCurrency(parsed.comm, shop.currency)),
                        React.createElement(ReactPDF.Text, { style: styles.colGross }, formatCurrency(parsed.gross, shop.currency)),
                        React.createElement(ReactPDF.Text, { style: styles.colPaye }, formatCurrency(parsed.paye, shop.currency)),
                        React.createElement(ReactPDF.Text, { style: styles.colShif }, formatCurrency(parsed.shif, shop.currency)),
                        React.createElement(ReactPDF.Text, { style: styles.colAhl }, formatCurrency(parsed.ahl, shop.currency)),
                        React.createElement(ReactPDF.Text, { style: styles.colNssf }, formatCurrency(parsed.nssf, shop.currency)),
                        React.createElement(ReactPDF.Text, { style: styles.colAdv }, formatCurrency(parsed.adv, shop.currency)),
                        React.createElement(ReactPDF.Text, { style: styles.colNet }, formatCurrency(parsed.net, shop.currency))
                    );
                })
            ),

            // Footer Section
            React.createElement(
                ReactPDF.View,
                { style: styles.footerSection },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.settleBox },
                    React.createElement(ReactPDF.Text, { style: { fontWeight: "bold", marginBottom: 3, textTransform: "uppercase", fontSize: 7.5 } }, "Merchant Statutory Authorization:"),
                    React.createElement(ReactPDF.Text, { style: { fontSize: 7, color: "#334155", lineHeight: 1.3 } }, `Official statutory payroll ledger for ${shop.name}. Verified and authorized for statutory compliance audit, KRA tax returns, and corporate financial reporting.`)
                ),
                React.createElement(
                    ReactPDF.View,
                    { style: styles.totalBox },
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.totalRow },
                        React.createElement(ReactPDF.Text, { style: { color: "#64748b", fontSize: 7.5 } }, "Gross Remuneration Pool:"),
                        React.createElement(ReactPDF.Text, { style: { fontSize: 7.5 } }, formatCurrency(doc.subTotal, shop.currency))
                    ),
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.totalRow },
                        React.createElement(ReactPDF.Text, { style: { color: "#64748b", fontSize: 7.5 } }, "Statutory & Adv Deductions:"),
                        React.createElement(ReactPDF.Text, { style: { color: "#b91c1c", fontSize: 7.5 } }, formatCurrency(doc.taxAmount, shop.currency))
                    ),
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.grandTotalRow },
                        React.createElement(ReactPDF.Text, null, "TOTAL NET DISBURSED CASH:"),
                        React.createElement(ReactPDF.Text, { style: { color: "#047857" } }, formatCurrency(doc.grandTotal, shop.currency))
                    )
                )
            ),

            // Legal Footer
            React.createElement(
                ReactPDF.View,
                { style: { ...styles.legalFooter, flexDirection: "row", justifyContent: "space-between", alignItems: "center" } },
                qrCodeDataUrl ? React.createElement(ReactPDF.Image, { src: qrCodeDataUrl, style: { width: 36, height: 36 } }) : React.createElement(ReactPDF.View, null),
                React.createElement(ReactPDF.Text, null, `Generated via Manna Books Financial Platform • Official Statutory Payroll Document for ${shop.name}`)
            )
        )
    );
};

// Inline Standard Document PDF Layout (Invoices, Receipts, Quotations, LPOs, etc.)
const StandardPdfDocumentStructure = ({ doc, shop, client, settlements, qrCodeDataUrl }: any) => {
    const primaryColor = shop.primaryColor || "#000000";

    const styles = ReactPDF.StyleSheet.create({
        page: { padding: 36, backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 8.5, color: "#000000" },
        header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1.5, borderBottomColor: "#e4e4e7", paddingBottom: 14, marginBottom: 16 },
        logoContainer: { width: "50%", flexDirection: "row", alignItems: "flex-start", gap: 10 },
        logoImage: { width: 40, height: 40, objectFit: "contain" },
        shopDetails: { flex: 1 },
        headerRight: { width: "48%", alignItems: "flex-end" },
        shopName: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase", color: primaryColor, marginBottom: 2 },
        typeBadge: { backgroundColor: primaryColor, color: "#ffffff", paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 3, fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase", alignSelf: "flex-end" },
        docSerial: { fontSize: 11, fontWeight: "bold", color: primaryColor, marginTop: 3, textAlign: "right" },
        metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16, backgroundColor: "#f9f9f9", padding: 10, borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 4 },
        metaCol: { width: "48%" },
        metaLabel: { color: "#71717a", fontSize: 7.5, fontWeight: "bold", marginBottom: 2.5, textTransform: "uppercase" },
        metaVal: { fontSize: 9.5, fontWeight: "bold" },
        statusBadge: {
            borderWidth: 1,
            borderColor: doc.status === "PAID" ? "#047857" : (doc.status === "ISSUED" ? "#f43f5e" : "#d4d4d8"),
            backgroundColor: doc.status === "PAID" ? "#ecfdf5" : "#ffffff",
            color: doc.status === "PAID" ? "#047857" : (doc.status === "ISSUED" ? "#e11d48" : "#71717a"),
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 3,
            fontSize: 7.5,
            fontWeight: "bold",
            textTransform: "uppercase",
            alignSelf: "flex-end"
        },
        tableHeader: { flexDirection: "row", backgroundColor: primaryColor, paddingVertical: 5, paddingHorizontal: 6, fontWeight: "bold", color: "#ffffff", fontSize: 7.5 },
        tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e4e4e7", paddingVertical: 5, paddingHorizontal: 6, alignItems: "center", fontSize: 8 },
        colMain: { width: "45%" },
        colQty: { width: "15%", textAlign: "center" },
        colRate: { width: "20%", textAlign: "right" },
        colTotal: { width: "20%", textAlign: "right" },
        footerSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 20 },
        settleBox: { width: "52%", padding: 8, backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#e4e4e7", borderLeftWidth: 3, borderLeftColor: primaryColor, borderRadius: 3 },
        totalBox: { width: "42%", padding: 8, borderWidth: 1, borderColor: primaryColor, backgroundColor: "#ffffff", borderRadius: 3 },
        totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
        grandTotalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: primaryColor, paddingTop: 4, marginTop: 3, fontWeight: "bold", fontSize: 9 },
        legalFooter: { marginTop: 24, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e4e4e7", textAlign: "center", color: "#a1a1aa", fontSize: 7.5 },
        termsBox: { marginTop: 12, padding: 8, backgroundColor: "#fafafa", borderWidth: 1, borderColor: "#e4e4e7", borderRadius: 3 },
        termsTitle: { fontSize: 7.5, fontWeight: "bold", textTransform: "uppercase", color: "#18181b", marginBottom: 3 },
        termsItem: { fontSize: 7, color: "#3f3f46", marginBottom: 1.5, lineHeight: 1.2 },
    });

    let parsedTerms: string[] = [];
    if (doc.termsAndConditions) {
        try {
            const parsed = JSON.parse(doc.termsAndConditions);
            if (Array.isArray(parsed)) {
                parsedTerms = parsed;
            } else if (typeof parsed === "string") {
                parsedTerms = [parsed];
            }
        } catch {
            parsedTerms = [doc.termsAndConditions];
        }
    }

    const shopDetailsChildren = [
        React.createElement(ReactPDF.Text, { key: "name", style: styles.shopName }, shop.shortName || shop.name),
        shop.taxPin ? React.createElement(ReactPDF.Text, { key: "pin", style: { fontSize: 7.5, color: "#52525b" } }, "Tax PIN: " + shop.taxPin) : null,
        shop.vatNumber ? React.createElement(ReactPDF.Text, { key: "vat", style: { fontSize: 7.5, color: "#52525b" } }, "VAT #: " + shop.vatNumber) : null,
        shop.phone ? React.createElement(ReactPDF.Text, { key: "tel", style: { fontSize: 7.5, color: "#52525b" } }, "Tel: " + shop.phone) : null,
        shop.website ? React.createElement(ReactPDF.Text, { key: "web", style: { fontSize: 7.5, color: primaryColor } }, shop.website) : null,
        React.createElement(ReactPDF.Text, { key: "channel", style: { fontSize: 6.5, color: "#a1a1aa", fontStyle: "italic", marginTop: 1 } }, "origin: secure ledger channel")
    ].filter(Boolean);

    const logoContainerChildren = [
        shop.logoUrl ? React.createElement(ReactPDF.Image, { key: "logo", src: shop.logoUrl, style: styles.logoImage }) : null,
        React.createElement(ReactPDF.View, { key: "details", style: styles.shopDetails }, ...shopDetailsChildren)
    ].filter(Boolean);

    const headerRightChildren = [
        React.createElement(ReactPDF.Text, { key: "badge", style: styles.typeBadge }, `${doc.type ? doc.type.replace(/_/g, " ") : "DOCUMENT"} SNAPSHOT`),
        React.createElement(ReactPDF.Text, { key: "serial", style: styles.docSerial }, doc.docNumber),
        doc.kraCuInvoiceNumber ? React.createElement(ReactPDF.Text, { key: "kra", style: { textAlign: "right", fontSize: 7.5, fontWeight: "bold", color: "#000000", marginTop: 2 } }, "KRA eTIMS CU #: " + doc.kraCuInvoiceNumber) : null,
        doc.paymentChannel ? React.createElement(ReactPDF.Text, { key: "channel", style: { textAlign: "right", fontSize: 7.5, fontWeight: "bold", color: "#047857", marginTop: 2 } }, "Paid via: " + doc.paymentChannel + (doc.paymentReference ? " (Ref: " + doc.paymentReference + ")" : "")) : null,
        React.createElement(ReactPDF.Text, { key: "issued", style: { textAlign: "right", fontSize: 7.5, color: "#71717a", marginTop: 2 } }, "Issued: " + new Date(doc.issueDate).toLocaleDateString()),
        doc.dueDate ? React.createElement(ReactPDF.Text, { key: "due", style: { textAlign: "right", fontSize: 7.5, color: "#e11d48", fontWeight: "bold" } }, "Maturity: " + new Date(doc.dueDate).toLocaleDateString()) : null
    ].filter(Boolean);

    const clientColChildren = [
        React.createElement(ReactPDF.Text, { key: "lbl", style: styles.metaLabel }, doc.supplier ? "SUPPLIER DESTINATION:" : "BILLING DESTINATION:"),
        React.createElement(ReactPDF.Text, { key: "name", style: styles.metaVal }, client.name),
        client.email && client.email !== "—" ? React.createElement(ReactPDF.Text, { key: "email", style: { fontSize: 7.5, color: "#52525b" } }, client.email) : null,
        client.phone ? React.createElement(ReactPDF.Text, { key: "phone", style: { fontSize: 7.5, color: "#52525b" } }, "Tel: " + client.phone) : null,
        client.taxPin ? React.createElement(ReactPDF.Text, { key: "pin", style: { fontSize: 7.5, color: "#000000", fontWeight: "bold" } }, "Tax PIN: " + client.taxPin) : null
    ].filter(Boolean);

    const totalBoxChildren = [
        React.createElement(
            ReactPDF.View,
            { key: "sub", style: styles.totalRow },
            React.createElement(ReactPDF.Text, { style: { color: "#71717a", fontSize: 7.5 } }, "Subtotal:"),
            React.createElement(ReactPDF.Text, { style: { fontSize: 7.5 } }, formatCurrency(doc.subTotal, shop.currency))
        ),
        parseFloat(doc.taxAmount) > 0 ? React.createElement(
            ReactPDF.View,
            { key: "tax", style: styles.totalRow },
            React.createElement(ReactPDF.Text, { style: { color: "#71717a", fontSize: 7.5 } }, "VAT (16%):"),
            React.createElement(ReactPDF.Text, { style: { fontSize: 7.5 } }, formatCurrency(doc.taxAmount, shop.currency))
        ) : null,
        React.createElement(
            ReactPDF.View,
            { key: "grand", style: styles.grandTotalRow },
            React.createElement(ReactPDF.Text, null, "GRAND TOTAL:"),
            React.createElement(ReactPDF.Text, { style: { color: primaryColor } }, formatCurrency(doc.grandTotal, shop.currency))
        )
    ].filter(Boolean);

    const pageChildren = [
        // Header
        React.createElement(
            ReactPDF.View,
            { key: "header", style: styles.header },
            React.createElement(ReactPDF.View, { style: styles.logoContainer }, ...logoContainerChildren),
            React.createElement(ReactPDF.View, { style: styles.headerRight }, ...headerRightChildren)
        ),

        // Metadata Row
        React.createElement(
            ReactPDF.View,
            { key: "meta", style: styles.metaRow },
            React.createElement(ReactPDF.View, { style: styles.metaCol }, ...clientColChildren),
            React.createElement(
                ReactPDF.View,
                { style: { ...styles.metaCol, textAlign: "right", alignItems: "flex-end" } },
                React.createElement(ReactPDF.Text, { style: styles.metaLabel }, "CURRENT STATUS:"),
                React.createElement(ReactPDF.Text, { style: styles.statusBadge }, doc.status),
                React.createElement(ReactPDF.Text, { style: { marginTop: 3, fontSize: 7.5, color: "#71717a" } }, "Currency: " + shop.currency)
            )
        ),

        // Table Header
        React.createElement(
            ReactPDF.View,
            { key: "tableHead", style: styles.tableHeader },
            React.createElement(ReactPDF.Text, { style: styles.colMain }, "DESCRIPTION / ITEM"),
            React.createElement(ReactPDF.Text, { style: styles.colQty }, "QTY"),
            React.createElement(ReactPDF.Text, { style: styles.colRate }, "UNIT PRICE"),
            React.createElement(ReactPDF.Text, { style: styles.colTotal }, "TOTAL AMOUNT")
        ),

        // Table Rows Body Container
        React.createElement(
            ReactPDF.View,
            { key: "tableBody", style: { width: "100%" } },
            doc.items.map((item: any) =>
                React.createElement(
                    ReactPDF.View,
                    { key: item.id, style: styles.tableRow },
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.colMain },
                        React.createElement(ReactPDF.Text, null, item.description),
                        item.notes ? React.createElement(ReactPDF.Text, { style: { fontSize: 6.5, color: "#71717a", marginTop: 1.5, fontStyle: "italic" } }, `(${item.notes})`) : null
                    ),
                    React.createElement(ReactPDF.Text, { style: styles.colQty }, item.quantity),
                    React.createElement(ReactPDF.Text, { style: styles.colRate }, formatCurrency(item.unitPrice, shop.currency)),
                    React.createElement(ReactPDF.Text, { style: styles.colTotal }, formatCurrency(item.itemTotal, shop.currency))
                )
            )
        ),

        // Footer Section
        React.createElement(
            ReactPDF.View,
            { key: "footer", style: styles.footerSection },
            React.createElement(
                ReactPDF.View,
                { style: styles.settleBox },
                React.createElement(ReactPDF.Text, { style: { fontWeight: "bold", marginBottom: 4, textTransform: "uppercase", fontSize: 7.5 } }, "Remittance / Payment Details:"),
                settlements.length > 0
                    ? settlements.map((s: any) => {
                        const parts = (s.details || "")
                            .split("\n")
                            .flatMap((line: any) => line.split("|"))
                            .map((p: any) => p.trim())
                            .filter(Boolean);
                        return React.createElement(
                            ReactPDF.View,
                            { key: s.id, style: { marginBottom: 3.5 } },
                            React.createElement(ReactPDF.Text, { style: { fontSize: 7.5, fontWeight: "bold", color: "#18181b", textTransform: "uppercase" } }, s.name),
                            parts.map((part: string, pIdx: number) => {
                                const colonIndex = part.indexOf(":");
                                if (colonIndex > -1) {
                                    const key = part.slice(0, colonIndex).trim();
                                    const val = part.slice(colonIndex + 1).trim();
                                    return React.createElement(
                                        ReactPDF.View,
                                        { key: pIdx, style: { flexDirection: "row", marginTop: 1 } },
                                        React.createElement(ReactPDF.Text, { style: { fontSize: 6.8, color: "#71717a", width: 55, textTransform: "uppercase" } }, `${key}:`),
                                        React.createElement(ReactPDF.Text, { style: { fontSize: 6.8, color: "#27272a", fontWeight: "bold" } }, val)
                                    );
                                }
                                return React.createElement(ReactPDF.Text, { key: pIdx, style: { fontSize: 6.8, color: "#3f3f46", marginTop: 1 } }, part);
                            })
                        );
                    })
                    : React.createElement(ReactPDF.Text, { style: { fontSize: 7, color: "#71717a", fontStyle: "italic" } }, "Direct bank transfers or cash payment. Contact supplier.")
            ),

            React.createElement(ReactPDF.View, { style: styles.totalBox }, ...totalBoxChildren)
        ),

        // Commercial Terms & Conditions Block
        parsedTerms.length > 0 ? React.createElement(
            ReactPDF.View,
            { key: "terms", style: styles.termsBox },
            React.createElement(ReactPDF.Text, { style: styles.termsTitle }, "Commercial Terms & Conditions:"),
            parsedTerms.map((t, idx) =>
                React.createElement(
                    ReactPDF.View,
                    { key: idx, style: { flexDirection: "row", alignItems: "flex-start", gap: 3 } },
                    React.createElement(ReactPDF.Text, { style: { fontSize: 7, color: "#71717a" } }, "•"),
                    React.createElement(ReactPDF.Text, { style: styles.termsItem }, t)
                )
            )
        ) : null,

        // Legal Footer
        React.createElement(
            ReactPDF.View,
            { key: "legal", style: { ...styles.legalFooter, flexDirection: "row", justifyContent: "space-between", alignItems: "center" } },
            qrCodeDataUrl ? React.createElement(ReactPDF.Image, { src: qrCodeDataUrl, style: { width: 34, height: 34 } }) : React.createElement(ReactPDF.View, null),
            React.createElement(ReactPDF.Text, null, "Generated via Manna Books Financial Platform • ETIMS Compliant Document Engine")
        )
    ].filter(Boolean);

    return React.createElement(
        ReactPDF.Document,
        null,
        React.createElement(ReactPDF.Page, { size: "A4", style: styles.page }, ...pageChildren)
    );
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ token: string }> }
) {
    try {
        const { token } = await params;

        let targetDocumentId: string | null = null;
        const tokenRecord = await db.query.documentTokens.findFirst({
            where: eq(documentTokens.token, token),
        });
        if (tokenRecord) {
            targetDocumentId = tokenRecord.documentId;
        }

        if (!targetDocumentId) {
            const tokenByDoc = await db.query.documentTokens.findFirst({
                where: eq(documentTokens.documentId, token),
            });
            if (tokenByDoc) {
                targetDocumentId = tokenByDoc.documentId;
            }
        }

        if (!targetDocumentId) {
            const directDoc = await db.query.documents.findFirst({
                where: eq(documents.id, token),
            });
            if (directDoc) {
                targetDocumentId = directDoc.id;
            }
        }

        if (!targetDocumentId) {
            return new NextResponse("Document not found.", { status: 404 });
        }

        const doc = await db.query.documents.findFirst({
            where: eq(documents.id, targetDocumentId),
            with: {
                client: true,
                supplier: true,
                shop: true,
                items: true,
            },
        });

        if (!doc) {
            return new NextResponse("Document not found.", { status: 404 });
        }

        const isPayroll = doc.type === "PAYROLL_VOUCHER";

        const party = doc.client || doc.supplier || {
            name: isPayroll 
                ? "Internal Company Staff Payroll" 
                : (doc.type === "RECEIPT" ? "Walk-in Customer" : (doc.type === "PAYMENT_VOUCHER" ? "Direct Vendor" : "Walk-in Customer")),
            email: "—",
            phone: null,
            taxPin: null,
        };

        const settlements = await db.query.paymentMethods.findMany({ where: eq(paymentMethods.shopId, doc.shop.id) });

        let actualToken = tokenRecord?.token;
        if (!actualToken) {
            const tokenByDoc = await db.query.documentTokens.findFirst({
                where: eq(documentTokens.documentId, targetDocumentId),
            });
            actualToken = tokenByDoc?.token || token;
        }
        
        let qrCodeDataUrl = "";
        try {
            const qrText = doc.kraCuInvoiceNumber
                ? `https://etims.kra.go.ke/query/invoice/verify?invoiceNo=${doc.kraCuInvoiceNumber}`
                : `https://mannabooks.co.ke/portal/invoice/${actualToken}`;
            qrCodeDataUrl = await QRCode.toDataURL(qrText, { errorCorrectionLevel: 'H', margin: 1 });
        } catch (err) {
            console.error("Failed to generate QR Code", err);
        }

        // Select PDF layout structure: Landscape Payroll Vector vs Standard Vector Document
        const PDFElement = isPayroll
            ? React.createElement(PayrollPdfDocumentStructure, { doc, shop: doc.shop, qrCodeDataUrl })
            : React.createElement(StandardPdfDocumentStructure, { doc, shop: doc.shop, client: party, settlements, qrCodeDataUrl });

        const streamStream = await ReactPDF.renderToStream(PDFElement);

        const chunks: any[] = [];
        for await (const chunk of streamStream) {
            chunks.push(chunk);
        }
        const pdfBuffer = Buffer.concat(chunks);

        return new NextResponse(pdfBuffer, {
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename=MannaBooks_${doc.docNumber}.pdf`
            }
        });
    } catch (error: any) {
        console.error("Vector compiler layout failed execution:", error);
        return new NextResponse(`Server Engine Error: ${error?.message || "Internal failure generating PDF"}`, { status: 500 });
    }
}