"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { getMockSession } from "@/lib/mockSession";

/**
 * Entry point — decides whether to send the visitor to /login or
 * /dashboard, based on whether they have a valid session
 * (api-specification.md §2, GET /auth/me).
 *
 * Matches app/(protected)/layout.tsx's guard logic exactly: a real 401
 * means "not logged in" → /login. A network error (no backend reachable
 * yet) checks for a dev-mode mock session (lib/mockSession.ts) instead —
 * only present if you've actually logged in via /login with the
 * NEXT_PUBLIC_DEV_LOGIN_* account — and only then goes to /dashboard;
 * otherwise it's /login same as a real 401.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    apiFetch("/auth/me")
      .then(() => router.replace("/dashboard"))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
          return;
        }
        router.replace(getMockSession() ? "/dashboard" : "/login");
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
      Loading…
    </div>
  );
}