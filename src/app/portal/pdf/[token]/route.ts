// src/app/portal/pdf/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documentTokens, documents, paymentMethods } from "@/db/schema";
import { eq } from "drizzle-orm";
import ReactPDF from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import React from "react";

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
const PayrollPdfDocumentStructure = ({ doc, shop }: any) => {
    const primaryColor = shop.primaryColor || "#047857";

    const styles = ReactPDF.StyleSheet.create({
        page: { padding: 28, backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 8, color: "#000000" },
        header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 2, borderBottomColor: primaryColor, paddingBottom: 12, marginBottom: 16 },
        logoContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
        logoImage: { width: 44, height: 44, objectFit: "contain" },
        shopName: { fontSize: 16, fontWeight: "bold", textTransform: "uppercase", color: "#000000" },
        docTitle: { fontSize: 16, fontWeight: "bold", textTransform: "uppercase", color: primaryColor, textAlign: "right" },
        metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 14, backgroundColor: "#f8fafc", padding: 10, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 3 },
        metaCol: { width: "48%" },
        metaLabel: { color: "#64748b", fontSize: 7, fontWeight: "bold", marginBottom: 2, textTransform: "uppercase" },
        metaVal: { fontSize: 9, fontWeight: "bold" },
        tableHeader: { flexDirection: "row", backgroundColor: primaryColor, paddingVertical: 5, paddingHorizontal: 4, fontWeight: "bold", color: "#ffffff", fontSize: 7 },
        tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#f1f5f9", paddingVertical: 5, paddingHorizontal: 4, alignItems: "center", fontSize: 7.5 },
        colName: { width: "20%" },
        colBase: { width: "9%", textAlign: "right" },
        colAllow: { width: "7%", textAlign: "right" },
        colComm: { width: "7%", textAlign: "right" },
        colGross: { width: "9%", textAlign: "right", fontWeight: "bold" },
        colPaye: { width: "7%", textAlign: "right", color: "#b91c1c" },
        colShif: { width: "7%", textAlign: "right" },
        colAhl: { width: "7%", textAlign: "right" },
        colNssf: { width: "7%", textAlign: "right" },
        colAdv: { width: "8%", textAlign: "right" },
        colNet: { width: "12%", textAlign: "right", fontWeight: "bold", color: "#047857" },
        footerSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
        settleBox: { width: "55%", padding: 10, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 3 },
        totalBox: { width: "40%", padding: 10, borderWidth: 1, borderColor: primaryColor, backgroundColor: "#ffffff", borderRadius: 3 },
        totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
        grandTotalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: primaryColor, paddingTop: 4, marginTop: 4, fontWeight: "bold", fontSize: 9 },
        legalFooter: { marginTop: 20, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e2e8f0", textAlign: "center", color: "#94a3b8", fontSize: 7.5 }
    });

    return React.createElement(
        ReactPDF.Document,
        null,
        React.createElement(
            ReactPDF.Page,
            { size: "A4", orientation: "landscape", style: styles.page },
            
            // Header with logo and merchant identity details
            React.createElement(
                ReactPDF.View,
                { style: styles.header },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.logoContainer },
                    shop.logoUrl && React.createElement(ReactPDF.Image, { src: shop.logoUrl, style: styles.logoImage }),
                    React.createElement(
                        ReactPDF.View,
                        null,
                        React.createElement(ReactPDF.Text, { style: styles.shopName }, shop.shortName || shop.name),
                        shop.taxPin && React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: "#475569", marginTop: 1 } }, "Tax PIN: " + shop.taxPin),
                        shop.phone && React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: "#475569" } }, "Tel: " + shop.phone),
                        shop.website && React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: primaryColor } }, shop.website)
                    )
                ),
                React.createElement(
                    ReactPDF.View,
                    null,
                    React.createElement(ReactPDF.Text, { style: styles.docTitle }, `PAYROLL VOUCHER ${doc.docNumber}`),
                    React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, color: "#475569", marginTop: 2 } }, "Issued Date: " + new Date(doc.issueDate).toLocaleDateString("en-KE", { dateStyle: "long" })),
                    React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, fontWeight: "bold", color: doc.status === "PAID" ? "#047857" : "#d97706", marginTop: 2 } }, `STATUS: ${doc.status}`)
                )
            ),

            // Metadata Row: Entity Identity & Status
            React.createElement(
                ReactPDF.View,
                { style: styles.metaRow },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.metaCol },
                    React.createElement(ReactPDF.Text, { style: styles.metaLabel }, "COMPANY REMUNERATION LEDGER:"),
                    React.createElement(ReactPDF.Text, { style: styles.metaVal }, shop.name),
                    React.createElement(ReactPDF.Text, null, "Internal Staff Payroll Allocation & Statutory Reserves Record"),
                    shop.phone && React.createElement(ReactPDF.Text, null, "Tel: " + shop.phone),
                    shop.taxPin && React.createElement(ReactPDF.Text, null, "Tax PIN: " + shop.taxPin.toUpperCase())
                ),
                React.createElement(
                    ReactPDF.View,
                    { style: { ...styles.metaCol, textAlign: "right" } },
                    React.createElement(ReactPDF.Text, { style: styles.metaLabel }, "LEDGER SUMMARY:"),
                    React.createElement(ReactPDF.Text, { style: styles.metaVal }, `Total Staff Entries: ${doc.items.length}`),
                    React.createElement(ReactPDF.Text, { style: { marginTop: 2, fontSize: 8, color: "#475569" } }, "Currency: " + shop.currency)
                )
            ),

            // Detailed Landscape Payroll Matrix Table Header
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

            // Detailed Line Items List
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
            }),

            // Footer Section: Merchant Authorization Notes & Financial Totals Summary
            React.createElement(
                ReactPDF.View,
                { style: styles.footerSection },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.settleBox },
                    React.createElement(ReactPDF.Text, { style: { fontWeight: "bold", marginBottom: 4, textTransform: "uppercase" } }, "Merchant Statutory Authorization:"),
                    React.createElement(ReactPDF.Text, { style: { fontSize: 7.5, color: "#334155", lineHeight: 1.3 } }, `Official statutory payroll ledger for ${shop.name}. Verified and authorized for statutory compliance audit, KRA tax returns, and corporate financial reporting.`)
                ),
                React.createElement(
                    ReactPDF.View,
                    { style: styles.totalBox },
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.totalRow },
                        React.createElement(ReactPDF.Text, { style: { color: "#64748b" } }, "Gross Remuneration Pool:"),
                        React.createElement(ReactPDF.Text, null, formatCurrency(doc.subTotal, shop.currency))
                    ),
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.totalRow },
                        React.createElement(ReactPDF.Text, { style: { color: "#64748b" } }, "Statutory & Adv Deductions:"),
                        React.createElement(ReactPDF.Text, { style: { color: "#b91c1c" } }, formatCurrency(doc.taxAmount, shop.currency))
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
                { style: styles.legalFooter },
                React.createElement(ReactPDF.Text, null, `Generated via Manna Books Financial Platform • Official Statutory Payroll Document for ${shop.name}`)
            )
        )
    );
};

// Inline Standard Document PDF Layout (Invoices, Receipts, Quotations, LPOs, etc.)
const StandardPdfDocumentStructure = ({ doc, shop, client, settlements }: any) => {
    const primaryColor = shop.primaryColor || "#000000";

    const styles = ReactPDF.StyleSheet.create({
        page: { padding: 36, backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 9, color: "#000000" },
        header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 2, borderBottomColor: primaryColor, paddingBottom: 16, marginBottom: 20 },
        logoContainer: { flexDirection: "row", alignItems: "center", gap: 10 },
        logoImage: { width: 44, height: 44, objectFit: "contain" },
        shopName: { fontSize: 16, fontWeight: "bold", textTransform: "uppercase", color: "#000000" },
        docTitle: { fontSize: 15, fontWeight: "bold", textTransform: "uppercase", color: primaryColor, textAlign: "right" },
        metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, backgroundColor: "#f9f9f9", padding: 12, borderWidth: 1, borderColor: "#e4e4e7" },
        metaCol: { width: "48%" },
        metaLabel: { color: "#71717a", fontSize: 8, fontWeight: "bold", marginBottom: 3, textTransform: "uppercase" },
        metaVal: { fontSize: 10, fontWeight: "bold" },
        tableHeader: { flexDirection: "row", backgroundColor: primaryColor, padding: 6, fontWeight: "bold", color: "#ffffff" },
        tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e4e4e7", padding: 6, alignItems: "center" },
        colMain: { width: "45%" },
        colQty: { width: "15%", textAlign: "center" },
        colRate: { width: "20%", textAlign: "right" },
        colTotal: { width: "20%", textAlign: "right" },
        footerSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
        settleBox: { width: "52%", padding: 10, backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#e4e4e7" },
        totalBox: { width: "42%", padding: 10, borderWidth: 1, borderColor: primaryColor, backgroundColor: "#ffffff" },
        totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
        grandTotalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: primaryColor, paddingTop: 6, marginTop: 4, fontWeight: "bold" },
        legalFooter: { marginTop: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e4e4e7", textAlign: "center", color: "#a1a1aa", fontSize: 8 }
    });

    return React.createElement(
        ReactPDF.Document,
        null,
        React.createElement(
            ReactPDF.Page,
            { size: "A4", style: styles.page },
            
            React.createElement(
                ReactPDF.View,
                { style: styles.header },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.logoContainer },
                    shop.logoUrl && React.createElement(ReactPDF.Image, { src: shop.logoUrl, style: styles.logoImage }),
                    React.createElement(
                        ReactPDF.View,
                        null,
                        React.createElement(ReactPDF.Text, { style: styles.shopName }, shop.shortName || shop.name),
                        shop.taxPin && React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: "#52525b", marginTop: 1 } }, "Tax PIN: " + shop.taxPin),
                        shop.phone && React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: "#52525b" } }, "Tel: " + shop.phone),
                        shop.website && React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: primaryColor } }, shop.website)
                    )
                ),
                React.createElement(
                    ReactPDF.View,
                    null,
                    React.createElement(ReactPDF.Text, { style: styles.docTitle }, `${doc.type} ${doc.docNumber}`),
                    doc.kraCuInvoiceNumber && React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, fontWeight: "bold", color: "#000000", marginTop: 2 } }, "KRA eTIMS CU #: " + doc.kraCuInvoiceNumber),
                    doc.paymentChannel && React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, fontWeight: "bold", color: "#047857", marginTop: 2 } }, "Paid via: " + doc.paymentChannel + (doc.paymentReference ? " (Ref: " + doc.paymentReference + ")" : "")),
                    React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, color: "#71717a", marginTop: 2 } }, "Issued Date: " + new Date(doc.issueDate).toLocaleDateString()),
                    doc.dueDate && React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, color: "#71717a" } }, "Due Date: " + new Date(doc.dueDate).toLocaleDateString())
                )
            ),

            React.createElement(
                ReactPDF.View,
                { style: styles.metaRow },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.metaCol },
                    React.createElement(ReactPDF.Text, { style: styles.metaLabel }, "BILLED TO:"),
                    React.createElement(ReactPDF.Text, { style: styles.metaVal }, client.name),
                    React.createElement(ReactPDF.Text, null, client.email),
                    client.phone && React.createElement(ReactPDF.Text, null, "Tel: " + client.phone),
                    client.taxPin && React.createElement(ReactPDF.Text, null, "Tax PIN: " + client.taxPin)
                ),
                React.createElement(
                    ReactPDF.View,
                    { style: { ...styles.metaCol, textAlign: "right" } },
                    React.createElement(ReactPDF.Text, { style: styles.metaLabel }, "STATUS / PAYMENT:"),
                    React.createElement(ReactPDF.Text, { style: { ...styles.metaVal, color: doc.status === "PAID" ? "#047857" : "#000000" } }, doc.status),
                    React.createElement(ReactPDF.Text, { style: { marginTop: 4, fontSize: 8, color: "#71717a" } }, "Currency: " + shop.currency)
                )
            ),

            React.createElement(
                ReactPDF.View,
                { style: styles.tableHeader },
                React.createElement(ReactPDF.Text, { style: styles.colMain }, "DESCRIPTION / ITEM"),
                React.createElement(ReactPDF.Text, { style: styles.colQty }, "QTY"),
                React.createElement(ReactPDF.Text, { style: styles.colRate }, "UNIT PRICE"),
                React.createElement(ReactPDF.Text, { style: styles.colTotal }, "TOTAL AMOUNT")
            ),

            doc.items.map((item: any) =>
                React.createElement(
                    ReactPDF.View,
                    { key: item.id, style: styles.tableRow },
                    React.createElement(ReactPDF.Text, { style: styles.colMain }, item.description),
                    React.createElement(ReactPDF.Text, { style: styles.colQty }, item.quantity),
                    React.createElement(ReactPDF.Text, { style: styles.colRate }, formatCurrency(item.unitPrice, shop.currency)),
                    React.createElement(ReactPDF.Text, { style: styles.colTotal }, formatCurrency(item.itemTotal, shop.currency))
                )
            ),

            React.createElement(
                ReactPDF.View,
                { style: styles.footerSection },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.settleBox },
                    React.createElement(ReactPDF.Text, { style: { fontWeight: "bold", marginBottom: 6, textTransform: "uppercase" } }, "Remittance / Payment Details:"),
                    settlements.length > 0
                        ? settlements.map((s: any) => React.createElement(ReactPDF.Text, { key: s.id, style: { marginBottom: 3, fontSize: 8 } }, "• " + s.name + ": " + s.details))
                        : React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: "#71717a" } }, "Contact merchant for settlement options.")
                ),
                React.createElement(
                    ReactPDF.View,
                    { style: styles.totalBox },
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.totalRow },
                        React.createElement(ReactPDF.Text, { style: { color: "#71717a" } }, "Subtotal:"),
                        React.createElement(ReactPDF.Text, null, formatCurrency(doc.subTotal, shop.currency))
                    ),
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.totalRow },
                        React.createElement(ReactPDF.Text, { style: { color: "#71717a" } }, "VAT Amount:"),
                        React.createElement(ReactPDF.Text, null, formatCurrency(doc.taxAmount, shop.currency))
                    ),
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.grandTotalRow },
                        React.createElement(ReactPDF.Text, null, "TOTAL DUE:"),
                        React.createElement(ReactPDF.Text, null, formatCurrency(doc.grandTotal, shop.currency))
                    )
                )
            ),

            React.createElement(
                ReactPDF.View,
                { style: styles.legalFooter },
                React.createElement(ReactPDF.Text, null, `Generated via Manna Books Financial Platform • Official Statutory Document for ${shop.name}`)
            )
        )
    );
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const resolvedParams = await params;
        const token = resolvedParams.token;

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
            return new NextResponse("Document node missing parameter paths.", { status: 404 });
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
            name: "Internal Company Staff Payroll",
            email: "—",
            phone: doc.shop?.phone || null,
            taxPin: doc.shop?.taxPin || null,
        };

        const settlements = await db.query.paymentMethods.findMany({ where: eq(paymentMethods.shopId, doc.shop.id) });

        // Select PDF layout structure: Landscape Payroll Vector vs Standard Vector Document
        const PDFElement = isPayroll
            ? React.createElement(PayrollPdfDocumentStructure, { doc, shop: doc.shop })
            : React.createElement(StandardPdfDocumentStructure, { doc, shop: doc.shop, client: party, settlements });

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
    } catch (error) {
        console.error("Vector compiler layout failed execution:", error);
        return new NextResponse("Server Engine Error.", { status: 500 });
    }
}