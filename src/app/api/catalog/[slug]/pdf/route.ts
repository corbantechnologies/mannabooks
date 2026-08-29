// src/app/api/catalog/[slug]/pdf/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getPublicCatalogData, decodeCatalogToken } from "@/lib/actions/catalog";
import ReactPDF from "@react-pdf/renderer";
import { formatCurrency } from "@/lib/utils";
import { registerPdfFonts } from "@/lib/pdf-fonts";
import React from "react";

registerPdfFonts();

interface CatalogPdfProps {
  shop: any;
  products: any[];
  searchQuery?: string;
  generatedDate: string;
  livePortalUrl: string;
  isCurated?: boolean;
}

const CatalogPdfDocument = ({
  shop,
  products,
  searchQuery,
  generatedDate,
  livePortalUrl,
  isCurated,
}: CatalogPdfProps) => {
  const primaryColor = typeof shop?.primaryColor === "string" && /^#[0-9A-Fa-f]{3,8}$/.test(shop.primaryColor)
    ? shop.primaryColor
    : "#000000";

  const styles = ReactPDF.StyleSheet.create({
    page: {
      padding: 32,
      backgroundColor: "#ffffff",
      fontFamily: "Helvetica",
      fontSize: 8.5,
      color: "#09090b",
    },
    headerContainer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      borderBottomWidth: 1.5,
      borderBottomColor: "#e4e4e7",
      paddingBottom: 14,
      marginBottom: 14,
    },
    brandBox: {
      width: "55%",
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    logo: {
      width: 44,
      height: 44,
      objectFit: "contain",
      borderRadius: 4,
    },
    shopInfo: {
      flex: 1,
    },
    shopName: {
      fontSize: 13,
      fontWeight: "bold",
      color: primaryColor,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    shopMeta: {
      fontSize: 7.5,
      color: "#71717a",
      marginTop: 2,
    },
    headerRight: {
      width: "42%",
      alignItems: "flex-end",
    },
    catalogBadge: {
      backgroundColor: isCurated ? "#0284c7" : primaryColor,
      color: "#ffffff",
      fontSize: 7.5,
      fontWeight: "bold",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 3,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    dateText: {
      fontSize: 7.5,
      color: "#71717a",
      marginTop: 2,
    },
    filterNotice: {
      backgroundColor: "#f4f4f5",
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: 4,
      marginBottom: 12,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    filterText: {
      fontSize: 7.5,
      color: "#52525b",
    },
    filterHighlight: {
      fontWeight: "bold",
      color: "#18181b",
    },
    tableHeader: {
      flexDirection: "row",
      backgroundColor: primaryColor,
      color: "#ffffff",
      paddingVertical: 5,
      paddingHorizontal: 6,
      fontWeight: "bold",
      fontSize: 7.5,
      borderRadius: 2,
    },
    tableRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: "#f4f4f5",
      paddingVertical: 6,
      paddingHorizontal: 6,
      alignItems: "center",
      fontSize: 8,
    },
    tableRowAlt: {
      backgroundColor: "#fafafa",
    },
    colName: { width: "45%" },
    colSku: { width: "20%", color: "#71717a" },
    colTax: { width: "15%", textAlign: "center", color: "#71717a", fontSize: 7 },
    colPrice: { width: "20%", textAlign: "right", fontWeight: "bold" },
    productName: {
      fontWeight: "bold",
      color: "#18181b",
      fontSize: 8,
    },
    productType: {
      fontSize: 6.5,
      color: "#a1a1aa",
      textTransform: "uppercase",
      marginTop: 1,
    },
    footerContainer: {
      marginTop: 20,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#e4e4e7",
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    footerLeft: {
      width: "65%",
    },
    footerLegal: {
      fontSize: 6.8,
      color: "#71717a",
      lineHeight: 1.3,
    },
    footerRight: {
      width: "32%",
      alignItems: "flex-end",
    },
    portalLink: {
      fontSize: 7.5,
      color: primaryColor,
      fontWeight: "bold",
      textDecoration: "underline",
    },
  });

  return React.createElement(
    ReactPDF.Document,
    null,
    React.createElement(
      ReactPDF.Page,
      { size: "A4", style: styles.page },
      // HEADER SECTION
      React.createElement(
        ReactPDF.View,
        { style: styles.headerContainer },
        React.createElement(
          ReactPDF.View,
          { style: styles.brandBox },
          shop.logoUrl
            ? React.createElement(ReactPDF.Image, {
                src: shop.logoUrl,
                style: styles.logo,
              })
            : null,
          React.createElement(
            ReactPDF.View,
            { style: styles.shopInfo },
            React.createElement(
              ReactPDF.Text,
              { style: styles.shopName },
              String(shop.shortName || shop.name || "Company")
            ),
            shop.taxPin
              ? React.createElement(
                  ReactPDF.Text,
                  { style: styles.shopMeta },
                  `Tax PIN: ${shop.taxPin}`
                )
              : null,
            shop.phone
              ? React.createElement(
                  ReactPDF.Text,
                  { style: styles.shopMeta },
                  `Tel: ${shop.phone}`
                )
              : null,
            shop.website
              ? React.createElement(
                  ReactPDF.Text,
                  { style: styles.shopMeta },
                  shop.website
                )
              : null
          )
        ),
        React.createElement(
          ReactPDF.View,
          { style: styles.headerRight },
          React.createElement(
            ReactPDF.Text,
            { style: styles.catalogBadge },
            isCurated ? "CURATED CATALOG" : "DIGITAL RATE CARD"
          ),
          React.createElement(
            ReactPDF.Text,
            { style: styles.dateText },
            `Generated on ${generatedDate}`
          ),
          React.createElement(
            ReactPDF.Text,
            { style: styles.dateText },
            `Total Products: ${products.length}`
          )
        )
      ),

      // ACTIVE FILTER / SEARCH NOTICE (if applicable)
      searchQuery || isCurated
        ? React.createElement(
            ReactPDF.View,
            { style: styles.filterNotice },
            React.createElement(
              ReactPDF.Text,
              { style: styles.filterText },
              isCurated
                ? "Special Curated Quotation Selection"
                : `Filtered by search term: "${searchQuery}"`
            ),
            React.createElement(
              ReactPDF.Text,
              { style: styles.filterHighlight },
              `${products.length} Items Listed`
            )
          )
        : null,

      // TABLE HEADER
      React.createElement(
        ReactPDF.View,
        { style: styles.tableHeader },
        React.createElement(ReactPDF.Text, { style: styles.colName }, "PRODUCT / SERVICE NAME"),
        React.createElement(ReactPDF.Text, { style: styles.colSku }, "SKU / CODE"),
        React.createElement(ReactPDF.Text, { style: styles.colTax }, "TAX STATUS"),
        React.createElement(ReactPDF.Text, { style: styles.colPrice }, "UNIT PRICE")
      ),

      // TABLE ROWS
      React.createElement(
        ReactPDF.View,
        { style: { width: "100%" } },
        products.map((p, idx) => {
          const isAlt = idx % 2 === 1;
          return React.createElement(
            ReactPDF.View,
            {
              key: p.id || idx,
              style: {
                ...styles.tableRow,
                ...(isAlt ? styles.tableRowAlt : {}),
              },
            },
            React.createElement(
              ReactPDF.View,
              { style: styles.colName },
              React.createElement(ReactPDF.Text, { style: styles.productName }, String(p.name || "")),
              p.type
                ? React.createElement(
                    ReactPDF.Text,
                    { style: styles.productType },
                    p.type.replace(/_/g, " ")
                  )
                : null
            ),
            React.createElement(ReactPDF.Text, { style: styles.colSku }, String(p.sku || "—")),
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

      // FOOTER WITH INTERACTIVE LINK
      React.createElement(
        ReactPDF.View,
        { style: styles.footerContainer },
        React.createElement(
          ReactPDF.View,
          { style: styles.footerLeft },
          React.createElement(
            ReactPDF.Text,
            { style: styles.footerLegal },
            `Official catalog and price schedule for ${shop.name}. All prices are in ${shop.currency || "KES"} and subject to commercial terms & availability.`
          ),
          React.createElement(
            ReactPDF.Text,
            { style: { ...styles.footerLegal, marginTop: 2, color: "#166534" } },
            "Live digital catalog & instant online quotes available via the portal link."
          )
        ),
        React.createElement(
          ReactPDF.View,
          { style: styles.footerRight },
          React.createElement(
            ReactPDF.Text,
            { style: { fontSize: 7, color: "#71717a", marginBottom: 1.5 } },
            "Interactive Online Portal:"
          ),
          React.createElement(
            ReactPDF.Link,
            { src: livePortalUrl, style: styles.portalLink },
            "Open Live Catalog →"
          )
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
    registerPdfFonts();
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
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

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "https://mannabooks.co.ke")
      .replace(/\/+$/, "")
      .replace("www.mannabooks.co.ke", "mannabooks.co.ke");

    const livePortalUrl = `${appUrl}/portal/catalog/${slug}${
      rawToken ? `?token=${encodeURIComponent(rawToken)}` : search ? `?search=${encodeURIComponent(search)}` : ""
    }`;

    const generatedDate = new Date().toLocaleDateString("en-KE", {
      dateStyle: "medium",
    });

    const PDFElement: any = React.createElement(CatalogPdfDocument, {
      shop: res.shop,
      products: res.products || [],
      searchQuery: search,
      generatedDate,
      livePortalUrl,
      isCurated,
    });

    const pdfStream = await ReactPDF.renderToStream(PDFElement);
    console.log("Catalog PDF generated for Shop:", res.shop?.name, "Products:", res.products?.length);

    const chunks: any[] = [];
    for await (const chunk of pdfStream) {
      chunks.push(chunk);
    }
    const pdfBuffer = Buffer.concat(chunks);

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${res.shop.slug || "catalog"}_price_card.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Failed to generate catalog PDF:", error);
    return new NextResponse(`Server Engine Error: ${error?.message || "Internal server error"}`, {
      status: 500,
    });
  }
}
