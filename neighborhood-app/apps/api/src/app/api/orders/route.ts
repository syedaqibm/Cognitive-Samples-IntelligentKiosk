import { createOrderSchema } from "@neighborhood/shared";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/db";
import { getUserFromRequest } from "@/lib/auth";
import { HttpError, handle, json, optionsResponse, parseJson, unauthorized } from "@/lib/http";
import { toOrderDto } from "@/lib/mappers";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsResponse();
}

const ORDER_INCLUDE = {
  listing: { select: { id: true, title: true, photoFilename: true, unit: true } },
  buyer: { select: { id: true, displayName: true } },
  seller: { select: { id: true, displayName: true, houseLabel: true } },
} as const;

export async function GET(req: Request) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    const url = new URL(req.url);
    const role = url.searchParams.get("role");

    const where =
      role === "seller"
        ? { sellerId: user.id }
        : role === "buyer"
          ? { buyerId: user.id }
          : { OR: [{ buyerId: user.id }, { sellerId: user.id }] };

    const orders = await prisma.order.findMany({
      where,
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
      include: ORDER_INCLUDE,
    });
    return json({ orders: orders.map(toOrderDto) });
  });
}

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export async function POST(req: Request) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    const input = await parseJson(req, createOrderSchema);

    const listing = await prisma.listing.findUnique({ where: { id: input.listingId } });
    if (!listing) throw new HttpError(404, "Listing not found");
    if (!listing.isActive) throw new HttpError(409, "Listing is no longer available");
    if (listing.sellerId === user.id) throw new HttpError(400, "You cannot order your own listing");
    if (input.quantity > listing.quantityAvailable) {
      throw new HttpError(409, `Only ${listing.quantityAvailable} available`);
    }

    const order = await prisma.order.create({
      data: {
        listingId: listing.id,
        buyerId: user.id,
        sellerId: listing.sellerId,
        quantity: input.quantity,
        unitPriceSnapshot: listing.pricePerUnit,
        status: "PENDING",
        orderToken: nanoid(24),
        pickupPin: randomPin(),
      },
      include: ORDER_INCLUDE,
    });

    return json({ order: toOrderDto(order) }, { status: 201 });
  });
}
