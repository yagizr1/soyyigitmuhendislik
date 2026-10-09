import "server-only";
import { randomBytes } from "node:crypto";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { PutObjectCommand, DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

const MAX_BYTES = 5 * 1024 * 1024;

const MIME_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
};

export type StoredFile = {
  filename: string;
  mimeType: string;
  size: number;
  storageKey: string;
  url: string;
};

export function detectImage(buffer: Buffer): string | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.toString("ascii", 0, 4) === "RIFF" &&
    buffer.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12);
    if (brand === "avif" || brand === "avis") return "image/avif";
  }
  return null;
}

function safeOriginalName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 80) || "gorsel";
}

function s3Config() {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION;
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const publicBase = process.env.S3_PUBLIC_BASE_URL;
  if (!endpoint || !region || !bucket || !accessKeyId || !secretAccessKey || !publicBase) {
    return null;
  }
  return { endpoint, region, bucket, accessKeyId, secretAccessKey, publicBase: publicBase.replace(/\/+$/, "") };
}

export function storageDriver(): "s3" | "local" {
  return process.env.STORAGE_DRIVER === "s3" && s3Config() ? "s3" : "local";
}

export async function saveImage(file: File): Promise<StoredFile> {
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("Görsel boş olamaz ve 5 MB sınırını aşamaz.");
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const mimeType = detectImage(buffer);
  if (!mimeType) {
    throw new Error("Yalnızca JPEG, PNG, WebP veya AVIF yüklenebilir.");
  }
  const ext = MIME_EXT[mimeType];
  if (!ext) throw new Error("Dosya türü desteklenmiyor.");

  const now = new Date();
  const folder = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
  const filename = `${randomBytes(16).toString("hex")}.${ext}`;
  const storageKey = `${folder}/${filename}`;

  if (storageDriver() === "s3") {
    const config = s3Config();
    if (!config) throw new Error("S3 ayarları eksik. Yerel depolama kullanılmadı.");
    const client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    await client.send(
      new PutObjectCommand({
        Bucket: config.bucket,
        Key: storageKey,
        Body: buffer,
        ContentType: mimeType,
        CacheControl: "public, max-age=31536000, immutable",
      }),
    );
    return {
      filename: safeOriginalName(file.name),
      mimeType,
      size: buffer.length,
      storageKey,
      url: `${config.publicBase}/${storageKey}`,
    };
  }

  const absoluteDir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(absoluteDir, { recursive: true });
  const absoluteFile = path.join(absoluteDir, filename);
  if (!absoluteFile.startsWith(path.join(process.cwd(), "public", "uploads"))) {
    throw new Error("Dosya yolu geçersiz.");
  }
  await writeFile(absoluteFile, buffer);
  return {
    filename: safeOriginalName(file.name),
    mimeType,
    size: buffer.length,
    storageKey,
    url: `/uploads/${storageKey}`,
  };
}

export async function deleteStoredFile(storageKey: string, url: string): Promise<void> {
  if (url.startsWith("http") && storageDriver() === "s3") {
    const config = s3Config();
    if (!config) return;
    const client = new S3Client({
      region: config.region,
      endpoint: config.endpoint,
      forcePathStyle: true,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
    await client.send(new DeleteObjectCommand({ Bucket: config.bucket, Key: storageKey }));
    return;
  }

  if (!/^[\w./-]+$/.test(storageKey) || storageKey.includes("..")) return;
  const absolute = path.join(process.cwd(), "public", "uploads", storageKey);
  const root = path.join(process.cwd(), "public", "uploads");
  if (!absolute.startsWith(root)) return;
  await unlink(absolute).catch(() => undefined);
}
