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
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
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
    throw new ApiError(res.status, await res.text());
  }

  return res.json();
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