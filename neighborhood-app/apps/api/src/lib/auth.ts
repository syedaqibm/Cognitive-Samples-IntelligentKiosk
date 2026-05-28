import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";
import { prisma } from "./db";

const ALG = "HS256";
const TOKEN_TTL = "30d";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET env var must be set to a string of at least 16 characters");
  }
  return new TextEncoder().encode(secret);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signUserToken(userId: string): Promise<string> {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(getSecret());
}

export async function verifyUserToken(token: string): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: [ALG] });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

function extractBearer(req: NextRequest | Request): string | null {
  const header = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (!header) return null;
  const [scheme, token] = header.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) return null;
  return token.trim();
}

export async function getUserFromRequest(req: NextRequest | Request) {
  const token = extractBearer(req);
  if (!token) return null;
  const userId = await verifyUserToken(token);
  if (!userId) return null;
  return prisma.user.findUnique({ where: { id: userId } });
}

export function toPublicUser(u: {
  id: string;
  email: string;
  displayName: string;
  houseLabel: string | null;
  createdAt: Date;
}) {
  return {
    id: u.id,
    email: u.email,
    displayName: u.displayName,
    houseLabel: u.houseLabel,
    createdAt: u.createdAt.toISOString(),
  };
}
