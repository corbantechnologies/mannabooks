import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand } from "@aws-sdk/client-s3";

const rawEndpoint = process.env.MINIO_ENDPOINT || "media.mannabooks.co.ke";
const useSsl = process.env.MINIO_USE_SSL !== "false";
const port = process.env.MINIO_PORT ? parseInt(process.env.MINIO_PORT) : (useSsl ? 443 : 9000);
const protocol = useSsl ? "https" : "http";

// Format endpoint for S3Client
const endpoint = rawEndpoint.startsWith("http")
  ? rawEndpoint
  : `${protocol}://${rawEndpoint}${port && port !== 80 && port !== 443 ? `:${port}` : ""}`;

const accessKeyId = process.env.MINIO_ACCESS_KEY || "";
const secretAccessKey = process.env.MINIO_SECRET_KEY || "";
export const DEFAULT_BUCKET = process.env.MINIO_BUCKET || "transactions";

let s3ClientInstance: S3Client | null = null;

export function getMinioClient(): S3Client {
  if (!s3ClientInstance) {
    if (!accessKeyId || !secretAccessKey) {
      console.warn("[MinIO] Notice: MINIO_ACCESS_KEY or MINIO_SECRET_KEY is not defined in environment.");
    }
    s3ClientInstance = new S3Client({
      endpoint,
      region: "us-east-1",
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // Necessary for MinIO sub-path routing
    });
  }
  return s3ClientInstance;
}

export function getPublicAttachmentUrl(key: string, bucket = DEFAULT_BUCKET): string {
  if (process.env.MINIO_PUBLIC_URL) {
    const base = process.env.MINIO_PUBLIC_URL.replace(/\/+$/, "");
    return `${base}/${key.replace(/^\/+/, "")}`;
  }
  const host = rawEndpoint.replace(/^https?:\/\//, "").replace(/\/+$/, "");
  return `${protocol}://${host}/${bucket}/${key.replace(/^\/+/, "")}`;
}

export async function uploadToMinio({
  fileBuffer,
  key,
  contentType,
  bucket = DEFAULT_BUCKET,
}: {
  fileBuffer: Buffer | Uint8Array;
  key: string;
  contentType: string;
  bucket?: string;
}) {
  const client = getMinioClient();
  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: contentType,
  });

  await client.send(command);
  return {
    key,
    bucket,
    url: getPublicAttachmentUrl(key, bucket),
  };
}

export async function deleteFromMinio({
  key,
  bucket = DEFAULT_BUCKET,
}: {
  key: string;
  bucket?: string;
}) {
  const client = getMinioClient();
  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });
  await client.send(command);
  return { success: true };
}
