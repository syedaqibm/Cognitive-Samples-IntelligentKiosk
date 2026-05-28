import { signupSchema } from "@neighborhood/shared";
import { prisma } from "@/lib/db";
import { hashPassword, signUserToken, toPublicUser } from "@/lib/auth";
import { handle, json, parseJson, optionsResponse, HttpError } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: Request) {
  return handle(async () => {
    const input = await parseJson(req, signupSchema);
    const existing = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (existing) {
      throw new HttpError(409, "An account with that email already exists");
    }
    const passwordHash = await hashPassword(input.password);
    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        displayName: input.displayName.trim(),
        houseLabel: input.houseLabel?.trim() || null,
      },
    });
    const token = await signUserToken(user.id);
    return json({ token, user: toPublicUser(user) }, { status: 201 });
  });
}
