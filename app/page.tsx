"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

/**
 * Entry point — decides whether to send the visitor to /login or
 * /dashboard, based on whether they have a valid session
 * (api-specification.md §2, GET /auth/me).
 *
 * Has to be a Client Component here: until the backend exists, this fetch
 * will simply fail (network error, since nothing's listening) — and
 * treating any failure as "not logged in" is exactly the right fallback
 * anyway, so there's nothing to special-case for "backend doesn't exist
 * yet" vs. "session expired" vs. "never logged in".
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    apiFetch("/auth/me")
      .then(() => router.replace("/dashboard"))
      .catch(() => router.replace("/login"));
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-gray-500 text-sm">
      Loading…
    </div>
  );
}