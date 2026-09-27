import { NextRequest, NextResponse } from "next/server";
import { verifyAndGetSession } from "@/lib/actions/auth";
import { uploadToMinio, DEFAULT_BUCKET } from "@/lib/storage/minio";
import crypto from "crypto";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
]);

export async function POST(req: NextRequest) {
  try {
    const session = await verifyAndGetSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const shopSlug = (formData.get("shopSlug") as string) || "workspace";
    const category = (formData.get("category") as string) || "transactions";

    if (!file) {
      return NextResponse.json({ error: "No file provided for upload" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File exceeds maximum allowed size of 10MB (${(file.size / 1024 / 1024).toFixed(1)}MB)` },
        { status: 400 }
      );
    }

    const contentType = file.type || "application/octet-stream";
    if (!ALLOWED_MIME_TYPES.has(contentType.toLowerCase())) {
      return NextResponse.json(
        { error: "Invalid file format. Allowed types: PDF, PNG, JPG, WEBP" },
        { status: 400 }
      );
    }

    // Clean filename
    const originalName = file.name || "attachment.pdf";
    const sanitizedName = originalName
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .toLowerCase();

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const uniqueId = crypto.randomUUID().slice(0, 8);
    const key = `${shopSlug}/${category}/${year}/${month}/${uniqueId}_${sanitizedName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await uploadToMinio({
      fileBuffer: buffer,
      key,
      contentType,
      bucket: DEFAULT_BUCKET,
    });

    return NextResponse.json({
      success: true,
      url: result.url,
      key: result.key,
      bucket: result.bucket,
      fileName: originalName,
      fileSize: file.size,
      fileType: contentType,
    });
  } catch (err: any) {
    console.error("[MinIO Upload Error]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to upload file to media storage" },
      { status: 500 }
    );
  }
}
