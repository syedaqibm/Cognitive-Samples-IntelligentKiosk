import { readPhoto } from "@/lib/storage";

export const runtime = "nodejs";

interface RouteCtx {
  params: { file: string };
}

export async function GET(_req: Request, { params }: RouteCtx) {
  const photo = await readPhoto(params.file);
  if (!photo) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(photo.data), {
    status: 200,
    headers: {
      "Content-Type": photo.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
