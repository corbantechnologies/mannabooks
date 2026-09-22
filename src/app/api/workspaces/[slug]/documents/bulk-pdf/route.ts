import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { shops } from "@/db/schema";
import { eq } from "drizzle-orm";
import JSZip from "jszip";
import { generateDocumentPdfBuffer } from "@/app/portal/pdf/[token]/route";
import { verifyAndGetSession } from "@/lib/actions/auth";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const session = await verifyAndGetSession();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const { slug } = await params;
        const shop = await db.query.shops.findFirst({
            where: eq(shops.slug, slug),
        });

        if (!shop) {
            return new NextResponse("Workspace not found", { status: 404 });
        }

        const body = await request.json();
        const documentIds: string[] = body.documentIds || [];

        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            return new NextResponse("No documents specified for bulk export.", { status: 400 });
        }

        // Create Zip container
        const zip = new JSZip();
        let bundledCount = 0;

        for (const docId of documentIds) {
            try {
                const pdfResult = await generateDocumentPdfBuffer(docId);
                if (pdfResult) {
                    zip.file(pdfResult.filename, pdfResult.buffer);
                    bundledCount++;
                }
            } catch (docErr) {
                console.warn(`Failed to bundle PDF for docId ${docId}:`, docErr);
            }
        }

        if (bundledCount === 0) {
            return new NextResponse("Failed to compile any documents into PDF.", { status: 500 });
        }

        const zipBuffer = await zip.generateAsync({
            type: "nodebuffer",
            compression: "DEFLATE",
            compressionOptions: { level: 6 },
        });

        const timestamp = new Date().toISOString().split("T")[0];
        const archiveName = `MannaBooks_${shop.slug}_Documents_${timestamp}.zip`;

        return new NextResponse(zipBuffer as unknown as BodyInit, {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${archiveName}"`,
            },
        });
    } catch (error: any) {
        console.error("Bulk PDF export error:", error);
        return new NextResponse(`Bulk export failed: ${error?.message || "Internal error"}`, { status: 500 });
    }
}
