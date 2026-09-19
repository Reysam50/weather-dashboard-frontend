"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import { tryMockLogin } from "@/lib/mockSession";
import NodeHealthPulse from "@/components/auth/NodeHealthPulse";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";
import WeatherStationIllustration from "@/components/auth/WeatherStationIllustration";

type AuthTab = "password" | "fido2" | "mtls";

/**
 * Login screen — rebuilt to match secure_login_telemetry_gateway. This is
 * the one screen in the whole redesign that talks to a REAL documented
 * endpoint (POST /auth/login, api-specification.md §2), so the actual
 * auth logic below is unchanged from before — only the visual layer
 * changed.
 *
 * Deliberately NOT included, because nothing in api-specification.md
 * backs them:
 * - TOTP code field — login only ever takes email+password; there's no
 *   2FA/TOTP verification endpoint documented.
 * - "AWS Telemetry Ingest Target" station picker — station access is
 *   determined server-side by the user's role/assignment, not chosen at
 *   login time.
 * Security Key (FIDO2) and mTLS Emergency Bypass tabs are shown (matching
 * the design) but disabled, same reasoning — no WebAuthn/mTLS backend
 * exists yet.
 *
 * The design's live mast-cam thumbnail is a real photo with no source to
 * point it at — replaced with an original decorative SVG illustration
 * instead (WeatherStationIllustration.tsx) rather than reproducing the
 * design's stock image.
 */
export default function LoginPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AuthTab>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, remember: rememberMe }),
      });
      router.push("/dashboard");
    } catch (err) {
      // Only a real 401 is proof a real backend exists AND rejected
      // these credentials. Everything else — a network error (no
      // backend at all), or a 404 (this exact route relative-URL-resolves
      // to the Next.js dev server itself when no backend is proxied in,
      // which answers unknown routes with a genuine HTTP 404, not a
      // connection failure) — is treated as "no real backend yet," so
      // fall back to the dev-only default account (lib/mockSession.ts)
      // instead of just failing. This stops firing on its own once a
      // real backend exists and actually answers these requests.
      if (err instanceof ApiError && err.status === 401) {
        setError("Incorrect email or password.");
      } else {
        const session = tryMockLogin(email, password);
        if (session) {
          router.push("/dashboard");
        } else {
          setError("Incorrect email or password.");
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-6 gap-4">
      {/* Header bar */}
      <div className="max-w-6xl w-full mx-auto flex items-center justify-between gap-4 bg-card-bg border border-border-line rounded-2xl px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-500/30 flex items-center justify-center text-primary-container flex-shrink-0">
            <span className="material-symbols-outlined text-[24px]">radar</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white uppercase">
                Y-NAXII Meteorological Intelligence
              </span>
              <span className="px-1.5 py-0.5 rounded bg-card-bg-subtle font-mono text-[9px] text-on-surface-variant">
                V4.8-SEC
              </span>
            </div>
            <span className="text-[11px] font-mono text-on-surface-variant">
              Automatic Weather Station (AWS) Telemetry Network
            </span>
          </div>
        </div>
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-card-bg-subtle border border-border-line font-mono text-[11px] text-primary-container font-semibold">
          <span className="material-symbols-outlined text-[15px]">lock</span>
          TLS 1.3 / mTLS
        </div>
      </div>

      {/* Main grid */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 flex-1">
        {/* Left column */}
        <div className="flex flex-col gap-4">
          <div className="bg-card-bg rounded-xl border border-border-line p-4 overflow-hidden">
            <WeatherStationIllustration />
            <span className="font-mono text-[10px] text-on-surface-variant block text-center mt-2">
              Observation Site — Zomba Plateau Ridge
            </span>
          </div>
          <NodeHealthPulse />
        </div>

        {/* Right column: auth card */}
        <div className="bg-card-bg rounded-2xl border border-border-line p-6 flex flex-col gap-5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded bg-error/15 border border-error/30 text-error font-mono text-[10px] font-bold uppercase">
              Restricted Level-4
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[11px] text-on-surface-variant">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              System Audit Active
            </span>
          </div>

          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Operator Authentication Gateway</h1>
            <p className="text-sm text-on-surface-variant mt-1">
              Present your institutional credentials to mount the real-time telemetry console.
            </p>
          </div>

          <div className="flex items-center bg-[#080c14] border border-border-line rounded-xl p-1 font-mono text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("password")}
              className={`flex-1 px-3 py-2 rounded-lg transition-colors ${
                activeTab === "password" ? "bg-card-bg-subtle text-primary-container font-semibold" : "text-slate-400 hover:text-white"
              }`}
            >
              Operator ID &amp; Pass
            </button>
            <button
              type="button"
              disabled
              title="WebAuthn/FIDO2 isn't wired up yet — no backend endpoint for it"
              className="flex-1 px-3 py-2 rounded-lg text-slate-600 cursor-not-allowed"
            >
              Security Key (FIDO2)
            </button>
            <button
              type="button"
              disabled
              title="mTLS client-cert auth isn't wired up yet"
              className="flex-1 px-3 py-2 rounded-lg text-slate-600 cursor-not-allowed"
            >
              mTLS Emergency Bypass
            </button>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-error/10 border border-error/25 text-error text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary-container">badge</span>
                Institutional Identity / Operator ID
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                autoComplete="username"
                placeholder="you@yournaxii.com"
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
            </label>

            <label className="block">
              <span className="text-xs font-mono font-semibold text-slate-300 flex items-center gap-1.5 mb-1.5">
                <span className="material-symbols-outlined text-[15px] text-primary-container">lock</span>
                Cryptographic Passphrase
              </span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full bg-[#080c14] border border-border-line rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
              />
            </label>

            <div className="flex items-center justify-between flex-wrap gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="accent-cyan-400"
                />
                <span className="text-xs text-on-surface-variant">Remember this workstation</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs font-mono text-primary-container hover:text-primary underline underline-offset-2"
              >
                Forgot Password
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-primary-container hover:bg-primary text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined text-[18px]">badge</span>
              {isSubmitting ? "Authenticating…" : "Authenticate & Enter Telemetry Ops Bridge"}
            </button>
          </form>
        </div>
      </div>

      {/* Legal footer */}
      <div className="max-w-6xl w-full mx-auto bg-[#080c14] border border-border-line rounded-xl px-5 py-3 flex items-start gap-2.5">
        <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5">warning</span>
        <p className="text-[11px] font-mono text-on-surface-variant leading-relaxed">
          Unauthorized access prohibited. All telemetry ingest access requests and IP footprints are
          recorded to audit journals.
        </p>
      </div>

      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
    </div>
  );
}