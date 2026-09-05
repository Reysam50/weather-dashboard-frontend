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
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    // 401 = not authenticated, 403 = insufficient permission, 404 = out of scope
    // for this role (see api-specification.md §8 for the 403-vs-404 rule) —
    // TODO (frontend developer): route 401 to /login, surface 403/404 in UI.
    throw new ApiError(res.status, await res.text());
  }

  return res.json();
}
