/**
 * Single REST fetch wrapper. Per coding-standards.md §3: no component calls
 * fetch() directly against the backend — everything goes through here so auth
 * cookie handling and error normalization live in one place.
 *
 * Auth: JWT is in an httpOnly cookie (system-architecture.md §5), same-origin,
 * so the browser attaches it automatically — no manual header wiring needed.
 * `credentials: "include"` below is what makes that actually happen.
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

export class ApiError extends Error {
  status: number;
  /** The API's machine-readable error code (api-specification.md's
   * Standard Error Shape), e.g. "DEVICE_ALREADY_PAIRED", when present. */
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  // FormData bodies (file uploads) need the browser to set its own
  // Content-Type with a multipart boundary — forcing "application/json"
  // here would silently corrupt any upload request.
  const isFormData = init?.body instanceof FormData;

  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    // 401 = not authenticated, 403 = insufficient permission, 404 = out of scope
    // for this role (see api-specification.md §8 for the 403-vs-404 rule).
    // 401 → redirect to /login is handled in app/(protected)/layout.tsx,
    // not here — this wrapper stays generic and just throws; individual
    // pages/callers still need to handle 403/404 in whatever way makes
    // sense for that specific request (most don't yet).
    const raw = await res.text();
    // Standard Error Shape: {"error": {"code": "...", "message": "..."}}.
    // Surface just the human-readable message, not the raw JSON body.
    try {
      const parsed = JSON.parse(raw) as { error?: { code?: string; message?: string } };
      if (parsed.error?.message) {
        throw new ApiError(res.status, parsed.error.message, parsed.error.code);
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
    }
    throw new ApiError(res.status, raw || res.statusText);
  }

  // 204 No Content (DELETE endpoints) and other empty bodies have nothing
  // to parse — calling res.json() on them throws, which would make a
  // successful delete look like a failure.
  if (res.status === 204 || res.headers.get("content-length") === "0") {
    return undefined as T;
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

/**
 * Builds a plain URL for endpoints that return a file rather than JSON
 * (data export, generated-report downloads — FR-8/FR-9). These are meant
 * for a real navigation/download (<a href>, window.open), not apiFetch,
 * since apiFetch always tries to parse the response as JSON and a
 * CSV/XLSX response body isn't that.
 */
export function apiUrl(path: string): string {
  return `${BASE_URL}${path}`;
}