// src/app/portal/pdf/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documentTokens, documents, paymentMethods } from "@/db/schema";
import { eq } from "drizzle-orm";
import ReactPDF from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import React from "react";

// Inline native atomic vector PDF layout definition
const PdfDocumentStructure = ({ doc, shop, client, settlements }: any) => {
    const primaryColor = shop.primaryColor || "#000000";
    const isPayroll = doc.type === "PAYROLL_VOUCHER";

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
        colMain: { width: isPayroll ? "60%" : "45%" },
        colQty: { width: isPayroll ? "10%" : "15%", textAlign: "center" },
        colRate: { width: isPayroll ? "15%" : "20%", textAlign: "right" },
        colTotal: { width: isPayroll ? "15%" : "20%", textAlign: "right" },
        footerSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
        settleBox: { width: "52%", padding: 10, backgroundColor: "#f9f9f9", borderWidth: 1, borderColor: "#e4e4e7" },
        totalBox: { width: "42%", padding: 10, borderWidth: 1, borderColor: primaryColor, backgroundColor: "#ffffff" },
        totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
        grandTotalRow: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: primaryColor, paddingTop: 6, marginTop: 4, fontWeight: "bold" },
        legalFooter: { marginTop: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e4e4e7", textAlign: "center", color: "#a1a1aa", fontSize: 8 }
    });

    const displayTitle = isPayroll
        ? `PAYROLL VOUCHER ${doc.docNumber}`
        : `${doc.type} ${doc.docNumber}`;

    return React.createElement(
        ReactPDF.Document,
        null,
        React.createElement(
            ReactPDF.Page,
            { size: "A4", style: styles.page },
            
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
                        shop.taxPin && React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: "#52525b", marginTop: 1 } }, "Tax PIN: " + shop.taxPin),
                        shop.phone && React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: "#52525b" } }, "Tel: " + shop.phone),
                        shop.website && React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: primaryColor } }, shop.website)
                    )
                ),
                React.createElement(
                    ReactPDF.View,
                    null,
                    React.createElement(ReactPDF.Text, { style: styles.docTitle }, displayTitle),
                    doc.kraCuInvoiceNumber && React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, fontWeight: "bold", color: "#000000", marginTop: 2 } }, "KRA eTIMS CU #: " + doc.kraCuInvoiceNumber),
                    doc.paymentChannel && React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, fontWeight: "bold", color: "#047857", marginTop: 2 } }, "Paid via: " + doc.paymentChannel + (doc.paymentReference ? " (Ref: " + doc.paymentReference + ")" : "")),
                    React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, color: "#71717a", marginTop: 2 } }, "Issued Date: " + new Date(doc.issueDate).toLocaleDateString()),
                    doc.dueDate && React.createElement(ReactPDF.Text, { style: { textAlign: "right", fontSize: 8, color: "#71717a" } }, "Due Date: " + new Date(doc.dueDate).toLocaleDateString())
                )
            ),

            // Metadata Row: Entity Identity & Status
            React.createElement(
                ReactPDF.View,
                { style: styles.metaRow },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.metaCol },
                    React.createElement(ReactPDF.Text, { style: styles.metaLabel }, isPayroll ? "COMPANY REMUNERATION LEDGER:" : "BILLED TO:"),
                    React.createElement(ReactPDF.Text, { style: styles.metaVal }, isPayroll ? shop.name : client.name),
                    React.createElement(ReactPDF.Text, null, isPayroll ? "Internal Staff Payroll Allocation" : client.email),
                    isPayroll ? shop.phone && React.createElement(ReactPDF.Text, null, "Tel: " + shop.phone) : client.phone && React.createElement(ReactPDF.Text, null, "Tel: " + client.phone),
                    isPayroll ? shop.taxPin && React.createElement(ReactPDF.Text, null, "Tax PIN: " + shop.taxPin) : client.taxPin && React.createElement(ReactPDF.Text, null, "Tax PIN: " + client.taxPin)
                ),
                React.createElement(
                    ReactPDF.View,
                    { style: { ...styles.metaCol, textAlign: "right" } },
                    React.createElement(ReactPDF.Text, { style: styles.metaLabel }, "VOUCHER STATUS:"),
                    React.createElement(ReactPDF.Text, { style: { ...styles.metaVal, color: doc.status === "PAID" ? "#047857" : "#d97706" } }, doc.status),
                    React.createElement(ReactPDF.Text, { style: { marginTop: 4, fontSize: 8, color: "#71717a" } }, "Currency: " + shop.currency)
                )
            ),

            // Line Items Table Header
            React.createElement(
                ReactPDF.View,
                { style: styles.tableHeader },
                React.createElement(ReactPDF.Text, { style: styles.colMain }, isPayroll ? "STAFF MEMBER & PAYROLL BREAKDOWN" : "DESCRIPTION / ITEM"),
                React.createElement(ReactPDF.Text, { style: styles.colQty }, "QTY"),
                React.createElement(ReactPDF.Text, { style: styles.colRate }, isPayroll ? "UNIT NET" : "UNIT PRICE"),
                React.createElement(ReactPDF.Text, { style: styles.colTotal }, isPayroll ? "NET OUTFLOW" : "TOTAL AMOUNT")
            ),

            // Line Items List
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

            // Footer Section: Merchant Remittance/Legal Notes & Financial Totals
            React.createElement(
                ReactPDF.View,
                { style: styles.footerSection },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.settleBox },
                    React.createElement(ReactPDF.Text, { style: { fontWeight: "bold", marginBottom: 6, textTransform: "uppercase" } }, isPayroll ? "Merchant Authorization Notes:" : "Remittance / Payment Details:"),
                    isPayroll
                        ? React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: "#3f3f46", lineHeight: 1.4 } }, `Official company payroll record for ${shop.name}. Verified and authorized for compliance audit and financial reporting.`)
                        : settlements.length > 0
                        ? settlements.map((s: any) => React.createElement(ReactPDF.Text, { key: s.id, style: { marginBottom: 3, fontSize: 8 } }, "• " + s.name + ": " + s.details))
                        : React.createElement(ReactPDF.Text, { style: { fontSize: 8, color: "#71717a" } }, "Contact merchant for settlement options.")
                ),
                React.createElement(
                    ReactPDF.View,
                    { style: styles.totalBox },
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.totalRow },
                        React.createElement(ReactPDF.Text, { style: { color: "#71717a" } }, isPayroll ? "Gross Remuneration Pool:" : "Subtotal:"),
                        React.createElement(ReactPDF.Text, null, formatCurrency(doc.subTotal, shop.currency))
                    ),
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.totalRow },
                        React.createElement(ReactPDF.Text, { style: { color: "#71717a" } }, isPayroll ? "Statutory & Adv Deductions:" : "VAT Amount:"),
                        React.createElement(ReactPDF.Text, null, formatCurrency(doc.taxAmount, shop.currency))
                    ),
                    React.createElement(
                        ReactPDF.View,
                        { style: styles.grandTotalRow },
                        React.createElement(ReactPDF.Text, null, isPayroll ? "TOTAL NET CASH DISBURSED:" : "TOTAL DUE:"),
                        React.createElement(ReactPDF.Text, null, formatCurrency(doc.grandTotal, shop.currency))
                    )
                )
            ),

            // Legal Footer
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

        const party = doc.client || doc.supplier || {
            name: "Internal Company Staff Payroll",
            email: "—",
            phone: doc.shop?.phone || null,
            taxPin: doc.shop?.taxPin || null,
        };

        const settlements = await db.query.paymentMethods.findMany({ where: eq(paymentMethods.shopId, doc.shop.id) });

        // Render vector PDF stream
        const streamStream = await ReactPDF.renderToStream(
            React.createElement(PdfDocumentStructure, { doc, shop: doc.shop, client: party, settlements })
        );

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