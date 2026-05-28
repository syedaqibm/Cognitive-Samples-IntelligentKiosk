import type { Listing, Order, User } from "@prisma/client";
import type { Category, ListingDto, OrderDto, OrderStatus, Unit } from "@neighborhood/shared";
import { photoUrlFor } from "./storage";

type ListingWithSeller = Listing & { seller: Pick<User, "id" | "displayName" | "houseLabel"> };

export function toListingDto(l: ListingWithSeller): ListingDto {
  return {
    id: l.id,
    sellerId: l.sellerId,
    sellerName: l.seller.displayName,
    sellerHouseLabel: l.seller.houseLabel,
    title: l.title,
    description: l.description,
    category: l.category as Category,
    unit: l.unit as Unit,
    pricePerUnit: l.pricePerUnit,
    quantityAvailable: l.quantityAvailable,
    photoUrl: photoUrlFor(l.photoFilename),
    isActive: l.isActive,
    createdAt: l.createdAt.toISOString(),
  };
}

type OrderWithRelations = Order & {
  listing: Pick<Listing, "id" | "title" | "photoFilename" | "unit">;
  buyer: Pick<User, "id" | "displayName">;
  seller: Pick<User, "id" | "displayName" | "houseLabel">;
};

export function toOrderDto(o: OrderWithRelations): OrderDto {
  return {
    id: o.id,
    listingId: o.listingId,
    listingTitle: o.listing.title,
    listingPhotoUrl: photoUrlFor(o.listing.photoFilename),
    buyerId: o.buyerId,
    buyerName: o.buyer.displayName,
    sellerId: o.sellerId,
    sellerName: o.seller.displayName,
    sellerHouseLabel: o.seller.houseLabel,
    quantity: o.quantity,
    unit: o.listing.unit as Unit,
    unitPriceSnapshot: o.unitPriceSnapshot,
    status: o.status as OrderStatus,
    orderToken: o.orderToken,
    pickupPin: o.pickupPin,
    createdAt: o.createdAt.toISOString(),
    completedAt: o.completedAt ? o.completedAt.toISOString() : null,
  };
}
