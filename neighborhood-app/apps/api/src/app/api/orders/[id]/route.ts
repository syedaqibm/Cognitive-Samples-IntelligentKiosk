import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { handle, json, notFound, optionsResponse, unauthorized, errorResponse } from "@/lib/http";
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

export async function GET(req: Request, { params }: RouteCtx) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: ORDER_INCLUDE,
    });
    if (!order) return notFound("Order not found");
    if (order.buyerId !== user.id && order.sellerId !== user.id) {
      return errorResponse("Forbidden", 403);
    }
    return json({ order: toOrderDto(order) });
  });
}
