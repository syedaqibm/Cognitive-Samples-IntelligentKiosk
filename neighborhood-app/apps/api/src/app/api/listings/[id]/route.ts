import { updateListingSchema } from "@neighborhood/shared";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { HttpError, handle, json, notFound, optionsResponse, parseJson, unauthorized } from "@/lib/http";
import { deletePhoto } from "@/lib/storage";
import { toListingDto } from "@/lib/mappers";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsResponse();
}

interface RouteCtx {
  params: { id: string };
}

export async function GET(req: Request, { params }: RouteCtx) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    const listing = await prisma.listing.findUnique({
      where: { id: params.id },
      include: { seller: { select: { id: true, displayName: true, houseLabel: true } } },
    });
    if (!listing) return notFound("Listing not found");
    return json({ listing: toListingDto(listing) });
  });
}

export async function PATCH(req: Request, { params }: RouteCtx) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    const listing = await prisma.listing.findUnique({ where: { id: params.id } });
    if (!listing) return notFound("Listing not found");
    if (listing.sellerId !== user.id) throw new HttpError(403, "Forbidden");

    const input = await parseJson(req, updateListingSchema);
    const updated = await prisma.listing.update({
      where: { id: params.id },
      data: {
        title: input.title?.trim() ?? undefined,
        description: input.description === undefined ? undefined : input.description?.trim() || null,
        category: input.category ?? undefined,
        unit: input.unit ?? undefined,
        pricePerUnit: input.pricePerUnit ?? undefined,
        quantityAvailable: input.quantityAvailable ?? undefined,
        isActive: input.isActive ?? undefined,
      },
      include: { seller: { select: { id: true, displayName: true, houseLabel: true } } },
    });
    return json({ listing: toListingDto(updated) });
  });
}

export async function DELETE(req: Request, { params }: RouteCtx) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    const listing = await prisma.listing.findUnique({ where: { id: params.id } });
    if (!listing) return notFound("Listing not found");
    if (listing.sellerId !== user.id) throw new HttpError(403, "Forbidden");

    const pendingOrders = await prisma.order.count({
      where: { listingId: params.id, status: "PENDING" },
    });
    if (pendingOrders > 0) {
      throw new HttpError(409, "Cannot delete a listing with pending orders");
    }

    if (listing.photoFilename) await deletePhoto(listing.photoFilename);
    await prisma.listing.delete({ where: { id: params.id } });
    return json({ ok: true });
  });
}
