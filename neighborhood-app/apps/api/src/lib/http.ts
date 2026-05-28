import { NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function json<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, {
    status: init?.status ?? 200,
    headers: CORS_HEADERS,
  });
}

export function errorResponse(message: string, status: number, details?: unknown) {
  return NextResponse.json(
    details === undefined ? { error: message } : { error: message, details },
    { status, headers: CORS_HEADERS },
  );
}

export function unauthorized() {
  return errorResponse("Unauthorized", 401);
}

export function notFound(what = "Not found") {
  return errorResponse(what, 404);
}

export function methodNotAllowed() {
  return errorResponse("Method not allowed", 405);
}

export async function parseJson<T>(req: Request, schema: ZodSchema<T>): Promise<T> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
  try {
    return schema.parse(body);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new HttpError(400, "Validation failed", err.flatten());
    }
    throw err;
  }
}

export class HttpError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export async function handle(fn: () => Promise<Response>): Promise<Response> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof HttpError) {
      return errorResponse(err.message, err.status, err.details);
    }
    console.error("Unhandled error:", err);
    return errorResponse("Internal server error", 500);
  }
}

export function optionsResponse() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}
