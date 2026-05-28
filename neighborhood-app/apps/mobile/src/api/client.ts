import Constants from "expo-constants";

const fromEnv = process.env.EXPO_PUBLIC_API_BASE_URL;
const fromManifest = (Constants.expoConfig?.extra as { apiBaseUrl?: string } | undefined)?.apiBaseUrl;

export const API_BASE_URL = (fromEnv || fromManifest || "http://localhost:3000").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type TokenProvider = () => string | null;
let getToken: TokenProvider = () => null;

export function setTokenProvider(provider: TokenProvider) {
  getToken = provider;
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  formData?: FormData;
  signal?: AbortSignal;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers: Record<string, string> = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let body: BodyInit | undefined;
  if (opts.formData) {
    body = opts.formData as unknown as BodyInit;
  } else if (opts.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(opts.body);
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method: opts.method ?? (body ? "POST" : "GET"),
      headers,
      body,
      signal: opts.signal,
    });
  } catch (err) {
    throw new ApiError(
      `Network error reaching ${url}. Is the API running and EXPO_PUBLIC_API_BASE_URL pointing to your LAN IP?`,
      0,
      err instanceof Error ? err.message : err,
    );
  }

  const text = await res.text();
  let payload: unknown = null;
  if (text.length > 0) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload && typeof payload.error === "string"
        ? (payload as { error: string }).error
        : `Request failed with status ${res.status}`;
    const details =
      payload && typeof payload === "object" && "details" in payload
        ? (payload as { details: unknown }).details
        : undefined;
    throw new ApiError(message, res.status, details);
  }

  return payload as T;
}

export function absoluteUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
