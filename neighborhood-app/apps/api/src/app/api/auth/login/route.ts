import { loginSchema } from "@neighborhood/shared";
import { prisma } from "@/lib/db";
import { signUserToken, toPublicUser, verifyPassword } from "@/lib/auth";
import { HttpError, handle, json, optionsResponse, parseJson } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsResponse();
}

export async function POST(req: Request) {
  return handle(async () => {
    const input = await parseJson(req, loginSchema);
    const user = await prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
    if (!user) throw new HttpError(401, "Invalid email or password");
    const ok = await verifyPassword(input.password, user.passwordHash);
    if (!ok) throw new HttpError(401, "Invalid email or password");
    const token = await signUserToken(user.id);
    return json({ token, user: toPublicUser(user) });
  });
}
