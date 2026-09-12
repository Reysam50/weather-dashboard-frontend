"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";

/**
 * Entry point — decides whether to send the visitor to /login or
 * /dashboard, based on whether they have a valid session
 * (api-specification.md §2, GET /auth/me).
 *
 * Matches app/(protected)/layout.tsx's guard logic: only a real 401 means
 * "not logged in" and sends you to /login. Any other failure (network
 * error, because there's no backend yet) falls through to /dashboard
 * instead — previously this treated every failure the same way, which
 * meant visiting "/" during frontend-only development always bounced to
 * /login even though the protected layout itself would have let you
 * through to /dashboard if you'd typed that URL directly.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    apiFetch("/auth/me")
      .then(() => router.replace("/dashboard"))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/login");
        } else {
          console.warn(
            "GET /auth/me failed without a 401 — defaulting to /dashboard:",
            err
          );
          router.replace("/dashboard");
        }
      });
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
      Loading…
    </div>
  );
}