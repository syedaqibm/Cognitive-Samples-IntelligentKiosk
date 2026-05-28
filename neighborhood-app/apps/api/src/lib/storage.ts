import { promises as fs } from "node:fs";
import path from "node:path";
import { nanoid } from "nanoid";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};

export async function ensureUploadsDir(): Promise<void> {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export interface SavedPhoto {
  filename: string;
  contentType: string;
}

export async function savePhoto(file: File): Promise<SavedPhoto> {
  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error(`Unsupported image type: ${file.type}`);
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller");
  }
  await ensureUploadsDir();
  const filename = `${nanoid(20)}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buf);
  return { filename, contentType: file.type };
}

export async function readPhoto(filename: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!/^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) {
    return null;
  }
  const fullPath = path.join(UPLOADS_DIR, filename);
  try {
    const data = await fs.readFile(fullPath);
    const lower = filename.toLowerCase();
    const contentType = lower.endsWith(".png")
      ? "image/png"
      : lower.endsWith(".webp")
        ? "image/webp"
        : "image/jpeg";
    return { data, contentType };
  } catch {
    return null;
  }
}

export async function deletePhoto(filename: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp)$/i.test(filename)) return;
  try {
    await fs.unlink(path.join(UPLOADS_DIR, filename));
  } catch {
    // ignore — file may not exist
  }
}

export function photoUrlFor(filename: string | null): string | null {
  return filename ? `/api/uploads/${filename}` : null;
}
