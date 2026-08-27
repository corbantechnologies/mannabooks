// src/app/api/catalog/[slug]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPublicCatalogData, decodeCatalogToken } from "@/lib/actions/catalog";
import ReactPDF from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import React from "react";
import QRCode from "qrcode";

interface CatalogPdfProps {
  shop: any;
  products: any[];
  searchQuery?: string;
  generatedDate: string;
  livePortalUrl: string;
  qrCodeDataUrl?: string;
  isCurated?: boolean;
}

const CatalogPdfDocument = ({
  shop,
  products,
  searchQuery,
  generatedDate,
  livePortalUrl,
  qrCodeDataUrl,
  isCurated,
}: CatalogPdfProps) => {
  const primaryColor = shop.primaryColor || "#000000";

  const styles = ReactPDF.StyleSheet.create({
    page: {
      padding: 32,
      backgroundColor: "#ffffff",
      fontFamily: "Helvetica",
      fontSize: 8.5,
      color: "#09090b",
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 1.5,
      borderBottomColor: "#18181b",
      paddingBottom: 12,
      marginBottom: 10,
    },
    logoContainer: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      maxWidth: "55%",
    },
    logoImage: {
      width: 44,
      height: 44,
      objectFit: "contain",
    },
    shopName: {
      fontSize: 14,
      fontWeight: "bold",
      textTransform: "uppercase",
      color: "#000000",
      letterSpacing: -0.2,
    },
    shopSubtitle: {
      fontSize: 7.5,
      color: "#71717a",
      marginTop: 2,
      textTransform: "uppercase",
    },
    contactBlock: {
      textAlign: "right",
      fontSize: 7.5,
      color: "#3f3f46",
      lineHeight: 1.35,
    },
    contactLine: {
      marginBottom: 1,
    },
    docTitleBanner: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      backgroundColor: "#f4f4f5",
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 4,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: "#e4e4e7",
    },
    docTitleText: {
      fontSize: 9,
      fontWeight: "bold",
      textTransform: "uppercase",
      color: "#18181b",
      letterSpacing: 0.3,
    },
    docMetaText: {
      fontSize: 7.5,
      color: "#71717a",
    },
    interactiveBanner: {
      backgroundColor: "#f0fdf4",
      borderWidth: 1,
      borderColor: "#bbf7d0",
      borderRadius: 4,
      paddingVertical: 5,
      paddingHorizontal: 8,
      marginBottom: 10,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    interactiveLink: {
      color: "#15803d",
      fontSize: 7.5,
      fontWeight: "bold",
      textDecoration: "underline",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: "#18181b",
      paddingVertical: 5,
      paddingHorizontal: 6,
      fontWeight: "bold",
      color: "#ffffff",
      fontSize: 7.5,
      borderRadius: 2,
      marginBottom: 2,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#f4f4f5",
      paddingVertical: 5.5,
      paddingHorizontal: 6,
      alignItems: "center",
      fontSize: 8,
    },
    tableRowAlt: {
      backgroundColor: "#fafafa",
    },
    colIndex: { width: "5%", color: "#a1a1aa", fontSize: 7 },
    colName: { width: "55%", paddingRight: 6 },
    colSku: { width: "16%", color: "#71717a", fontSize: 7 },
    colTax: { width: "10%", fontSize: 7, color: "#71717a" },
    colPrice: { width: "14%", textAlign: "right", fontWeight: "bold", color: "#000000" },
    productName: {
      fontWeight: "bold",
      color: "#09090b",
      lineHeight: 1.25,
      fontSize: 8,
    },
    productType: {
      fontSize: 6.5,
      color: "#71717a",
      textTransform: "uppercase",
      marginTop: 1,
    },
    footer: {
      position: "absolute",
      bottom: 20,
      left: 32,
      right: 32,
      borderTopWidth: 1,
      borderTopColor: "#e4e4e7",
      paddingTop: 6,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 7,
      color: "#71717a",
    },
    qrCodeImage: {
      width: 36,
      height: 36,
    },
    footerTextCol: {
      flex: 1,
      paddingLeft: 8,
    },
  });

  return React.createElement(
    ReactPDF.Document,
    null,
    React.createElement(
      ReactPDF.Page,
      { size: "A4", style: styles.page },
      
      // HEADER
      React.createElement(
        ReactPDF.View,
        { style: styles.header },
        React.createElement(
          ReactPDF.View,
          { style: styles.logoContainer },
          shop.logoUrl ? React.createElement(ReactPDF.Image, { src: shop.logoUrl, style: styles.logoImage }) : null,
          React.createElement(
            ReactPDF.View,
            null,
            React.createElement(ReactPDF.Text, { style: styles.shopName }, shop.name),
            React.createElement(
              ReactPDF.Text,
              { style: styles.shopSubtitle },
              isCurated ? "Curated Product Quotation Rate Sheet" : "Commercial Product Catalog & Price Sheet"
            )
          )
        ),
        React.createElement(
          ReactPDF.View,
          { style: styles.contactBlock },
          shop.phone ? React.createElement(ReactPDF.Text, { style: styles.contactLine }, `Tel: ${shop.phone}`) : null,
          shop.email ? React.createElement(ReactPDF.Text, { style: styles.contactLine }, `Email: ${shop.email}`) : null,
          shop.website ? React.createElement(ReactPDF.Text, { style: styles.contactLine }, `Web: ${shop.website}`) : null,
          shop.taxPin ? React.createElement(ReactPDF.Text, { style: styles.contactLine }, `KRA PIN: ${shop.taxPin}`) : null
        )
      ),

      // TITLE & META BANNER
      React.createElement(
        ReactPDF.View,
        { style: styles.docTitleBanner },
        React.createElement(
          ReactPDF.Text,
          { style: styles.docTitleText },
          isCurated
            ? `Curated Product Selection (${products.length} Items)`
            : searchQuery
            ? `Product Catalog — "${searchQuery.toUpperCase()}"`
            : "Official Product Catalog & Price List"
        ),
        React.createElement(
          ReactPDF.Text,
          { style: styles.docMetaText },
          `Date: ${generatedDate} • ${products.length} Products Listed`
        )
      ),

      // INTERACTIVE LINK BANNER
      React.createElement(
        ReactPDF.View,
        { style: styles.interactiveBanner },
        React.createElement(
          ReactPDF.Link,
          { src: livePortalUrl, style: styles.interactiveLink },
          "🔗 Click here to open this interactive product showcase & submit a formal quotation request online →"
        )
      ),

      // TABLE HEADER
      React.createElement(
        ReactPDF.View,
        { style: styles.tableHeader },
        React.createElement(ReactPDF.Text, { style: styles.colIndex }, "#"),
        React.createElement(ReactPDF.Text, { style: styles.colName }, "Product / Service Specification"),
        React.createElement(ReactPDF.Text, { style: styles.colSku }, "Code / SKU"),
        React.createElement(ReactPDF.Text, { style: styles.colTax }, "Tax"),
        React.createElement(ReactPDF.Text, { style: styles.colPrice }, `Price (${shop.currency})`)
      ),

      // TABLE ROWS CONTAINER
      React.createElement(
        ReactPDF.View,
        { style: { width: "100%" } },
        products.map((p, idx) => {
          return React.createElement(
            ReactPDF.View,
            {
              key: p.id,
              style: [styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}],
            },
            React.createElement(ReactPDF.Text, { style: styles.colIndex }, String(idx + 1)),
            React.createElement(
              ReactPDF.View,
              { style: styles.colName },
              React.createElement(ReactPDF.Text, { style: styles.productName }, p.name),
              React.createElement(ReactPDF.Text, { style: styles.productType }, p.itemType)
            ),
            React.createElement(ReactPDF.Text, { style: styles.colSku }, p.sku || "—"),
            React.createElement(
              ReactPDF.Text,
              { style: styles.colTax },
              p.defaultTaxType === "V_16" ? "16% VAT" : "Exempt"
            ),
            React.createElement(
              ReactPDF.Text,
              { style: styles.colPrice },
              formatCurrency(p.unitPrice, shop.currency)
            )
          );
        })
      ),

      // FOOTER WITH QR CODE & INTERACTIVE LINK
      React.createElement(
        ReactPDF.View,
        { style: styles.footer },
        qrCodeDataUrl
          ? React.createElement(ReactPDF.Image, { src: qrCodeDataUrl, style: styles.qrCodeImage })
          : null,
        React.createElement(
          ReactPDF.View,
          { style: styles.footerTextCol },
          React.createElement(
            ReactPDF.Text,
            null,
            `For inquiries or formal procurement, contact ${shop.email || shop.phone || shop.name}`
          ),
          React.createElement(
            ReactPDF.Text,
            { style: { marginTop: 2, color: "#15803d", fontWeight: "bold" } },
            "Scan the QR code or click the green banner above to customize quantities and submit your quotation request online."
          )
        ),
        React.createElement(
          ReactPDF.Text,
          null,
          `Generated via Manna Books`
        )
      )
    )
  );
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams, origin } = new URL(request.url);
    const search = searchParams.get("search") || undefined;
    const rawToken =
      searchParams.get("token") ||
      searchParams.get("c") ||
      searchParams.get("items") ||
      undefined;

    let itemIds: string[] | undefined;
    if (rawToken) {
      itemIds = await decodeCatalogToken(rawToken);
    }

    const res = await getPublicCatalogData(slug, search, itemIds);
    if (!res.success || !res.shop) {
      return new NextResponse("Catalog not found.", { status: 404 });
    }

    const isCurated = !!(itemIds && itemIds.length > 0);

    // Build the live interactive web portal URL
    const baseUrl = process.env.NEXTAUTH_URL || origin || "https://www.mannabooks.co.ke";
    const livePortalUrl = `${baseUrl}/portal/catalog/${slug}${
      rawToken ? `?token=${encodeURIComponent(rawToken)}` : search ? `?search=${encodeURIComponent(search)}` : ""
    }`;

    let qrCodeDataUrl = "";
    try {
      qrCodeDataUrl = await QRCode.toDataURL(livePortalUrl, {
        errorCorrectionLevel: "M",
        margin: 1,
      });
    } catch (e) {
      console.warn("Failed to generate QR code for catalog PDF:", e);
    }

    const generatedDate = new Date().toLocaleDateString("en-KE", {
      dateStyle: "medium",
    });

    const PDFElement: any = React.createElement(CatalogPdfDocument, {
      shop: res.shop,
      products: res.products || [],
      searchQuery: search,
      generatedDate,
      livePortalUrl,
      qrCodeDataUrl,
      isCurated,
    });

    const pdfStream = await ReactPDF.renderToStream(PDFElement);

    // Convert stream to Buffer / Uint8Array
    const chunks: Buffer[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(typeof chunk === "string" ? Buffer.from(chunk) : chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    const safeFilename = `catalog_${res.shop.slug}_${new Date().toISOString().split("T")[0]}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${safeFilename}"`,
        "Cache-Control": "public, max-age=60, s-maxage=60",
      },
    });
  } catch (error: any) {
    console.error("Failed to generate catalog PDF:", error);
    return new NextResponse("Failed to generate catalog PDF.", { status: 500 });
  }
}
