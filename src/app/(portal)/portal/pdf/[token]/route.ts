// src/app/api/portal/pdf/[token]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { documentTokens, paymentMethods } from "@/db/schema";
import { eq } from "drizzle-orm";
import ReactPDF from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import React from "react";

// Inline native atomic vector PDF layout definition
const PdfDocumentStructure = ({ doc, shop, client, settlements }: any) => {
    const styles = ReactPDF.StyleSheet.create({
        page: { padding: 40, backgroundColor: "#ffffff", fontFamily: "Helvetica", fontSize: 10, color: "#000000" },
        header: { flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#000000", paddingBottom: 20, marginBottom: 20 },
        title: { fontSize: 18, fontWeight: "bold", textTransform: "uppercase" },
        metaRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 30 },
        tableHeader: { flexDirection: "row", backgroundColor: "#f4f4f5", borderBottomWidth: 1, borderBottomColor: "#000000", padding: 6, fontWeight: "bold" },
        tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e4e4e7", padding: 6 },
        colMain: { width: "50%" },
        colQty: { width: "10%", textAlign: "center" },
        colRate: { width: "20%", textAlign: "right" },
        colTotal: { width: "20%", textAlign: "right" },
        footerSection: { flexDirection: "row", justifyContent: "space-between", marginTop: 40 },
        settleBox: { width: "50%", padding: 10, backgroundColor: "#f4f4f5", borderWidth: 1, borderColor: "#000000" },
        totalBox: { width: "40%", gap: 6 }
    });

    return React.createElement(
        ReactPDF.Document,
        null,
        React.createElement(
            ReactPDF.Page,
            { size: "A4", style: styles.page },
            // Company details header
            React.createElement(
                ReactPDF.View,
                { style: styles.header },
                React.createElement(ReactPDF.View, null, React.createElement(ReactPDF.Text, { style: styles.title }, shop.name), shop.taxPin && React.createElement(ReactPDF.Text, null, "PIN: " + shop.taxPin)),
                React.createElement(ReactPDF.View, { style: { textAlign: "right" } }, React.createElement(ReactPDF.Text, { style: { fontWeight: "bold" } }, doc.docNumber), React.createElement(ReactPDF.Text, null, "Date: " + new Date(doc.issueDate).toLocaleDateString()))
            ),
            // Metadata client info
            React.createElement(
                ReactPDF.View,
                { style: styles.metaRow },
                React.createElement(ReactPDF.View, null, React.createElement(ReactPDF.Text, { style: { color: "#71717a", marginBottom: 4 } }, "BILLED TO:"), React.createElement(ReactPDF.Text, { style: { fontWeight: "bold" } }, client.name), React.createElement(ReactPDF.Text, null, client.email), client.taxPin && React.createElement(ReactPDF.Text, null, "Tax PIN: " + client.taxPin)),
                React.createElement(ReactPDF.View, null, React.createElement(ReactPDF.Text, { style: { color: "#71717a", marginBottom: 4 } }, "STATUS:"), React.createElement(ReactPDF.Text, { style: { fontWeight: "bold" } }, doc.status))
            ),
            // Line item list mapping
            React.createElement(
                ReactPDF.View,
                { style: styles.tableHeader },
                React.createElement(ReactPDF.Text, { style: styles.colMain }, "DESCRIPTION"),
                React.createElement(ReactPDF.Text, { style: styles.colQty }, "QTY"),
                React.createElement(ReactPDF.Text, { style: styles.colRate }, "RATE"),
                React.createElement(ReactPDF.Text, { style: styles.colTotal }, "TOTAL")
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
            // Aggregate summary calculations
            React.createElement(
                ReactPDF.View,
                { style: styles.footerSection },
                React.createElement(
                    ReactPDF.View,
                    { style: styles.settleBox },
                    React.createElement(ReactPDF.Text, { style: { fontWeight: "bold", marginBottom: 6 } }, "REMITTANCE DIRECTIONS:"),
                    settlements.map((s: any) => React.createElement(ReactPDF.Text, { key: s.id, style: { marginBottom: 4 } }, s.name + ": " + s.details))
                ),
                React.createElement(
                    ReactPDF.View,
                    { style: styles.totalBox },
                    React.createElement(ReactPDF.Text, null, "Sub-Total: " + formatCurrency(doc.subTotal, shop.currency)),
                    React.createElement(ReactPDF.Text, null, "VAT Amount: " + formatCurrency(doc.taxAmount, shop.currency)),
                    React.createElement(ReactPDF.Text, { style: { fontWeight: "bold", borderTopWidth: 1, paddingTop: 4 } as any }, "TOTAL DUE: " + formatCurrency(doc.grandTotal, shop.currency))
                )
            )
        )
    );
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
    try {
        const resolvedParams = await params;
        const tokenData = await db.query.documentTokens.findFirst({
            where: eq(documentTokens.token, resolvedParams.token),
            with: {
                document: { with: { client: true, shop: true, items: true } }
            }
        });

        if (!tokenData || !tokenData.document) {
            return new NextResponse("Document node missing parameter paths.", { status: 404 });
        }

        const doc = tokenData.document;
        const settlements = await db.query.paymentMethods.findMany({ where: eq(paymentMethods.shopId, doc.shop.id) });

        // Render stream instance payload buffer
        const streamStream = await ReactPDF.renderToStream(
            React.createElement(PdfDocumentStructure, { doc, shop: doc.shop, client: doc.client, settlements })
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