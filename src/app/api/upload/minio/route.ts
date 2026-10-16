import { NextRequest, NextResponse } from "next/server";
import { verifyAndGetSession } from "@/lib/auth/session";
import { apiClient } from "@/lib/api/client";
import { uploadToMinio, DEFAULT_BUCKET } from "@/lib/storage/minio";
import crypto from "crypto";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_CATEGORIES = new Set([
  "transactions",
  "attachments",
  "payment-vouchers",
  "vendor-bills",
  "receipts",
  "expenses",
  "incomes",
  "logos",
]);

/** Detect the real file type from its first bytes (the browser-declared MIME type is not trusted). */
function sniffMime(buf: Buffer): string | null {
  if (buf.length >= 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-") return "application/pdf";
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  if (buf.length >= 8 && buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (buf.length >= 12 && buf.subarray(0, 4).toString("latin1") === "RIFF" && buf.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  return null;
}

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
    const shopSlug = String(formData.get("shopSlug") || "");
    const category = String(formData.get("category") || "transactions");

    if (!/^[a-z0-9-]{1,100}$/.test(shopSlug) || !ALLOWED_CATEGORIES.has(category)) {
      return NextResponse.json({ error: "Invalid workspace or upload category" }, { status: 400 });
    }

    // Uploads are stored under the workspace prefix, so the caller must belong to that workspace.
    const ctxRes = await apiClient.get<{ success: boolean }>(`/v1/workspaces/by-slug/${shopSlug}/context`);
    if (!ctxRes.data?.success) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

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
    const sniffed = sniffMime(buffer);
    const declared = contentType.toLowerCase() === "image/jpg" ? "image/jpeg" : contentType.toLowerCase();
    if (!sniffed || sniffed !== declared) {
      return NextResponse.json({ error: "File content does not match an allowed type (PDF, PNG, JPG, WEBP)" }, { status: 400 });
    }

    const result = await uploadToMinio({
      fileBuffer: buffer,
      key,
      contentType: sniffed,
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
      { error: "Failed to upload file to media storage" },
      { status: 500 }
    );
  }
}
