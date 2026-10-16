/** @type {import('next').NextConfig} */

// The browser talks to ONE origin (this Next.js app). Everything under /api is
// proxied to the Django backend, so the httpOnly auth cookie is same-origin and
// no CORS setup is needed (ADR-0003). 127.0.0.1 (not "localhost") because Node can
// resolve localhost to ::1 first and the dev backend listens on IPv4 only. Set
// BACKEND_ORIGIN when the backend isn't
// on localhost:8000.
//
// The WebSocket does NOT go through this proxy: Next's rewrites don't forward
// WebSocket upgrades reliably. The browser connects straight to the backend
// (NEXT_PUBLIC_WS_URL, e.g. ws://localhost:8000/ws); the auth cookie still
// travels with the handshake because cookies are shared across ports on the
// same host.
const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN ?? "http://127.0.0.1:8000";

const nextConfig = {
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${BACKEND_ORIGIN}/api/:path*` }];
  },
};

export default nextConfig;
