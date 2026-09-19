import type { Role } from "./mockAuth";

const SESSION_KEY = "dev-mock-session";

export interface MockSession {
  id: string;
  email: string;
  role: Role;
  stations: string[] | "all";
}

/**
 * Single default dev account, from env vars (per your request — a real
 * account you can actually log in with right now). Both are
 * NEXT_PUBLIC_ because this check only ever runs client-side and is
 * explicitly a dev-only shim, not real auth — nothing security-sensitive
 * should ever depend on these being secret.
 *
 * Once a real backend exists, POST /auth/login and GET /auth/me succeed
 * (or fail with a real 401) instead of a network error, so this is never
 * consulted — no code changes needed elsewhere to retire it, though you
 * can delete the env vars whenever you want to turn it off explicitly.
 */
function getDevAccount(): { email: string; password: string } | null {
  const email = process.env.NEXT_PUBLIC_DEV_LOGIN_EMAIL;
  const password = process.env.NEXT_PUBLIC_DEV_LOGIN_PASSWORD;
  if (!email || !password) return null;
  return { email, password };
}

export function tryMockLogin(email: string, password: string): MockSession | null {
  const account = getDevAccount();
  if (!account) return null;
  if (account.email.toLowerCase() !== email.trim().toLowerCase() || account.password !== password) {
    return null;
  }
  const session: MockSession = {
    id: "dev-user",
    email: account.email,
    role: "technical_team",
    stations: "all",
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

export function getMockSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearMockSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}