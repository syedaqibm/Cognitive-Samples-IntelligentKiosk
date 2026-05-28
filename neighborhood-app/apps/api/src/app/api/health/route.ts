export const runtime = "nodejs";

export function GET() {
  return Response.json({ ok: true, service: "neighborhood-api", time: new Date().toISOString() });
}
