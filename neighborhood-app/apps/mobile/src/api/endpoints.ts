import type {
  AuthResponse,
  ConfirmPickupInput,
  CreateListingInput,
  CreateOrderInput,
  ListingDto,
  LoginInput,
  OrderDto,
  PublicUser,
  SignupInput,
} from "@neighborhood/shared";
import { apiFetch } from "./client";

export const auth = {
  signup(input: SignupInput) {
    return apiFetch<AuthResponse>("/api/auth/signup", { method: "POST", body: input });
  },
  login(input: LoginInput) {
    return apiFetch<AuthResponse>("/api/auth/login", { method: "POST", body: input });
  },
  me() {
    return apiFetch<{ user: PublicUser }>("/api/auth/me");
  },
};

export interface ListingPhoto {
  uri: string;
  name: string;
  type: string;
}

export const listings = {
  browse() {
    return apiFetch<{ listings: ListingDto[] }>("/api/listings?excludeMine=true&active=true");
  },
  mine() {
    return apiFetch<{ listings: ListingDto[] }>("/api/listings?mine=true");
  },
  get(id: string) {
    return apiFetch<{ listing: ListingDto }>(`/api/listings/${id}`);
  },
  create(input: CreateListingInput, photo?: ListingPhoto) {
    if (!photo) {
      return apiFetch<{ listing: ListingDto }>("/api/listings", { method: "POST", body: input });
    }
    const form = new FormData();
    form.append("title", input.title);
    if (input.description) form.append("description", input.description);
    form.append("category", input.category);
    form.append("unit", input.unit);
    form.append("pricePerUnit", String(input.pricePerUnit));
    form.append("quantityAvailable", String(input.quantityAvailable));
    // React Native FormData file format
    form.append("photo", {
      uri: photo.uri,
      name: photo.name,
      type: photo.type,
    } as unknown as Blob);
    return apiFetch<{ listing: ListingDto }>("/api/listings", { method: "POST", formData: form });
  },
  remove(id: string) {
    return apiFetch<{ ok: true }>(`/api/listings/${id}`, { method: "DELETE" });
  },
};

export const orders = {
  list(role?: "buyer" | "seller") {
    const qs = role ? `?role=${role}` : "";
    return apiFetch<{ orders: OrderDto[] }>(`/api/orders${qs}`);
  },
  get(id: string) {
    return apiFetch<{ order: OrderDto }>(`/api/orders/${id}`);
  },
  create(input: CreateOrderInput) {
    return apiFetch<{ order: OrderDto }>("/api/orders", { method: "POST", body: input });
  },
  confirm(id: string, input: ConfirmPickupInput) {
    return apiFetch<{ order: OrderDto }>(`/api/orders/${id}/confirm`, { method: "POST", body: input });
  },
};
