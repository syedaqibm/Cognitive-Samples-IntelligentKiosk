import { confirmPickupSchema } from "@neighborhood/shared";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { HttpError, handle, json, notFound, optionsResponse, parseJson, unauthorized } from "@/lib/http";
import { toOrderDto } from "@/lib/mappers";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsResponse();
}

interface RouteCtx {
  params: { id: string };
}

const ORDER_INCLUDE = {
  listing: { select: { id: true, title: true, photoFilename: true, unit: true } },
  buyer: { select: { id: true, displayName: true } },
  seller: { select: { id: true, displayName: true, houseLabel: true } },
} as const;

export async function POST(req: Request, { params }: RouteCtx) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    const input = await parseJson(req, confirmPickupSchema);

    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { listing: true },
    });
    if (!order) return notFound("Order not found");
    if (order.buyerId !== user.id) {
      throw new HttpError(403, "Only the buyer can confirm pickup");
    }
    if (order.status !== "PENDING") {
      throw new HttpError(409, `Order is already ${order.status.toLowerCase()}`);
    }

    const tokenOk = order.orderToken === input.token.trim();
    const pinOk = order.pickupPin === input.pin.trim();

    if (!tokenOk || !pinOk) {
      const reason = !tokenOk && !pinOk ? "token and PIN mismatch" : !tokenOk ? "token mismatch" : "PIN mismatch";
      await prisma.pickupVerification.create({
        data: { orderId: order.id, success: false, failureReason: reason },
      });
      throw new HttpError(400, "Pickup verification failed", { reason });
    }

    const completed = await prisma.$transaction(async (tx) => {
      const newQty = Math.max(0, order.listing.quantityAvailable - order.quantity);
      await tx.listing.update({
        where: { id: order.listingId },
        data: {
          quantityAvailable: newQty,
          isActive: newQty > 0 ? order.listing.isActive : false,
        },
      });
      const updated = await tx.order.update({
        where: { id: order.id },
        data: { status: "COMPLETED", completedAt: new Date() },
        include: ORDER_INCLUDE,
      });
      await tx.pickupVerification.create({
        data: { orderId: order.id, success: true },
      });
      return updated;
    });

    return json({ order: toOrderDto(completed) });
  });
}
