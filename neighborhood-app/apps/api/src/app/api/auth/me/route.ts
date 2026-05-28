import { getUserFromRequest, toPublicUser } from "@/lib/auth";
import { handle, json, optionsResponse, unauthorized } from "@/lib/http";

export const runtime = "nodejs";

export function OPTIONS() {
  return optionsResponse();
}

export async function GET(req: Request) {
  return handle(async () => {
    const user = await getUserFromRequest(req);
    if (!user) return unauthorized();
    return json({ user: toPublicUser(user) });
  });
}
