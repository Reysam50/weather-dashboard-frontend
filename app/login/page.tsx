"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, ApiError } from "@/lib/api";
import NodeHealthPulse from "@/components/auth/NodeHealthPulse";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

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
 * - The design's live mast-cam thumbnail — a real still/video feed with
 *   no source to point it at would just be a fake photo, so it's replaced
 *   with an honest static panel instead.
 * Security Key (FIDO2) and mTLS Emergency Bypass tabs are shown (matching
 * the design) but disabled, same reasoning — no WebAuthn/mTLS backend
 * exists yet. Same for the two SSO buttons at the bottom.
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
      if (err instanceof ApiError && err.status === 401) {
        setError("Incorrect email or password.");
      } else {
        setError("Something went wrong logging in. Please try again.");
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
              Automatic Weather Station (AWS) Telemetry Network // Ops Bridge
            </span>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-on-surface-variant">
          <span className="material-symbols-outlined text-[15px] text-secondary">shield</span>
          PROD CLUSTER // MALAWI MET SERVICES &amp; UNIMA CO-OP
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
          <div className="bg-card-bg rounded-xl border border-border-line p-5 flex flex-col items-center justify-center text-center gap-2 min-h-[160px]">
            <span className="material-symbols-outlined text-[32px] text-slate-600">videocam_off</span>
            <span className="font-mono text-[11px] text-on-surface-variant">
              Live mast camera feed not connected
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
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">
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
              <span className="text-xs font-mono font-semibold text-slate-300 block mb-1.5">Cryptographic Passphrase</span>
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
                Report lost token / Recovery
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

          <div className="flex items-center gap-3 text-on-surface-variant">
            <div className="flex-1 h-px bg-border-line" />
            <span className="text-[10px] font-mono">OR FEDERATE VIA AUTHORIZED INSTITUTION</span>
            <div className="flex-1 h-px bg-border-line" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              disabled
              title="Institutional SSO isn't connected yet"
              className="py-2.5 rounded-lg border border-border-line text-slate-600 font-mono text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">school</span>
              UNIMA Institutional SSO
            </button>
            <button
              type="button"
              disabled
              title="Gov OIDC gateway isn't connected yet"
              className="py-2.5 rounded-lg border border-border-line text-slate-600 font-mono text-xs cursor-not-allowed flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[15px]">account_balance</span>
              Malawi Gov OIDC Gateway
            </button>
          </div>
        </div>
      </div>

      {/* Legal footer */}
      <div className="max-w-6xl w-full mx-auto bg-[#080c14] border border-border-line rounded-xl px-5 py-3 flex items-start gap-2.5">
        <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5">warning</span>
        <p className="text-[11px] font-mono text-on-surface-variant leading-relaxed">
          Unauthorized access prohibited // WMO &amp; Malawian Meteorological Service data governance. All
          telemetry ingest access requests and IP footprints are recorded to audit journals.
        </p>
      </div>

      {showForgotPassword && <ForgotPasswordModal onClose={() => setShowForgotPassword(false)} />}
    </div>
  );
}