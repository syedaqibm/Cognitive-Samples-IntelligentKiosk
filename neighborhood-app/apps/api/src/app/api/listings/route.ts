import { createListingSchema, type Category, type Unit } from "@neighborhood/shared";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { HttpError, errorResponse, handle, json, optionsResponse, unauthorized } from "@/lib/http";
import { savePhoto } from "@/lib/storage";
import { toListingDto } from "@/lib/mappers";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: Request) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    const url = new URL(req.url);
    const excludeMine = url.searchParams.get("excludeMine") === "true";
    const activeOnly = url.searchParams.get("active") !== "false";
    const mineOnly = url.searchParams.get("mine") === "true";

    const where: { sellerId?: string | { not: string }; isActive?: boolean } = {};
    if (mineOnly) where.sellerId = user.id;
    else if (excludeMine) where.sellerId = { not: user.id };
    if (activeOnly && !mineOnly) where.isActive = true;

    const listings = await prisma.listing.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { seller: { select: { id: true, displayName: true, houseLabel: true } } },
    });
    return json({ listings: listings.map(toListingDto) });
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();

    const contentType = req.headers.get("content-type") ?? "";
    let title: string;
    let description: string | null;
    let category: Category;
    let unit: Unit;
    let pricePerUnit: number;
    let quantityAvailable: number;
    let photoFilename: string | null = null;

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const raw = {
        title: String(form.get("title") ?? ""),
        description: form.get("description") ? String(form.get("description")) : null,
        category: String(form.get("category") ?? ""),
        unit: String(form.get("unit") ?? ""),
        pricePerUnit: Number(form.get("pricePerUnit")),
        quantityAvailable: Number(form.get("quantityAvailable")),
      };
      const parsed = createListingSchema.safeParse(raw);
      if (!parsed.success) {
        return errorResponse("Validation failed", 400, parsed.error.flatten());
      }
      ({ title, category, unit, pricePerUnit, quantityAvailable } = parsed.data);
      description = parsed.data.description ?? null;

      const photo = form.get("photo");
      if (photo && photo instanceof File && photo.size > 0) {
        try {
          const saved = await savePhoto(photo);
          photoFilename = saved.filename;
        } catch (err) {
          throw new HttpError(400, err instanceof Error ? err.message : "Photo upload failed");
        }
      }
    } else {
      let body: unknown;
      try {
        body = await req.json();
      } catch {
        throw new HttpError(400, "Invalid JSON body");
      }
      const parsed = createListingSchema.safeParse(body);
      if (!parsed.success) {
        return errorResponse("Validation failed", 400, parsed.error.flatten());
      }
      ({ title, category, unit, pricePerUnit, quantityAvailable } = parsed.data);
      description = parsed.data.description ?? null;
    }

    const created = await prisma.listing.create({
      data: {
        sellerId: user.id,
        title: title.trim(),
        description: description?.trim() || null,
        category,
        unit,
        pricePerUnit,
        quantityAvailable,
        photoFilename,
      },
      include: { seller: { select: { id: true, displayName: true, houseLabel: true } } },
    });

    return json({ listing: toListingDto(created) }, { status: 201 });
  });
}
