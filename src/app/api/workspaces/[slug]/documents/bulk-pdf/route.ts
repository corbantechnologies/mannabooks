import { NextRequest, NextResponse } from "next/server";
import { apiClient } from "@/lib/api/client";
import JSZip from "jszip";
import { generateDocumentPdfBuffer } from "@/app/portal/pdf/[token]/route";

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const ctxRes = await apiClient<{ success: boolean; shop: any }>(
            `/v1/workspaces/by-slug/${encodeURIComponent(slug)}/context`
        );

        if (!ctxRes.data?.success || !ctxRes.data.shop) {
            return new NextResponse("Workspace not found", { status: 404 });
        }

        const body = await request.json();
        const documentIds: string[] = body.documentIds || [];

        if (!Array.isArray(documentIds) || documentIds.length === 0) {
            return new NextResponse("No documents specified for bulk export.", { status: 400 });
        }
        if (documentIds.length > 100) {
            return new NextResponse("At most 100 documents can be exported at once.", { status: 400 });
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

        const zipFilename = `${slug}_documents_${Date.now()}.zip`;

        return new NextResponse(new Uint8Array(zipBuffer), {
            headers: {
                "Content-Type": "application/zip",
                "Content-Disposition": `attachment; filename="${zipFilename}"`,
            },
        });
    } catch (error: any) {
        console.error("Bulk PDF export failure:", error);
        return new NextResponse(`Export failed: ${error?.message || "Internal error"}`, { status: 500 });
    }
}
