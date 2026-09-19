"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/mockAuth";
import { useAuth } from "@/lib/AuthContext";
import { mockStations } from "@/lib/mockStations";
import { clearMockSession } from "@/lib/mockSession";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";

function initials(email: string) {
  const namePart = email.split("@")[0];
  return namePart.slice(0, 2).toUpperCase();
}

/**
 * Account menu — the only place to reach Change Password
 * (POST /auth/change-password) and Log Out (POST /auth/logout), both
 * wired to the real backend. Also shows the real signed-in identity and
 * station access scope from GET /auth/me (lib/AuthContext.tsx), rather
 * than just a role label.
 *
 * The dropdown itself is portaled to document.body and positioned from
 * the trigger button's own bounding rect (rather than a plain `absolute`
 * child) — same stacking-context reasoning as NotificationsPanel.tsx.
 */
export default function AccountMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const stationAccessLabel =
    user.stations === "all"
      ? "All Stations (Network Wide)"
      : user.stations.length === 0
      ? "No stations assigned"
      : user.stations
          .map((id) => mockStations.find((s) => s.id === id)?.name ?? id)
          .join(", ");

  function handleToggle() {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
    }
    setOpen((v) => !v);
  }

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // No real backend yet, or the request failed — clear the dev mock
      // session too so a stale one doesn't just log you straight back in.
      clearMockSession();
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-400/30 flex items-center justify-center text-white font-mono text-xs font-bold shadow-[0_0_12px_rgba(0,229,255,0.2)] flex-shrink-0"
        aria-label="Account menu"
      >
        {initials(user.email)}
      </button>

      {open &&
        createPortal(
          <>
            <button
              type="button"
              aria-label="Close account menu"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[1150]"
            />
            <div
              className="fixed w-64 rounded-xl bg-[#141b2e] border border-border-line shadow-2xl z-[1200] py-2 font-mono text-xs"
              style={{ top: menuPos.top, right: menuPos.right }}
            >
              <div className="px-4 py-2.5 border-b border-border-line">
                <span className="text-white font-semibold block truncate">{user.email}</span>
                <span className="text-primary-container text-[10px] block mt-0.5">{ROLE_LABELS[user.role]}</span>
              </div>
              <div className="px-4 py-2.5 border-b border-border-line">
                <span className="text-on-surface-variant text-[10px] uppercase block mb-0.5">Station Access</span>
                <span className="text-slate-200 text-[11px] block">{stationAccessLabel}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowChangePassword(true);
                  setOpen(false);
                }}
                className="w-full text-left px-4 py-2 hover:bg-slate-800/60 text-slate-200 flex items-center gap-2.5 transition-colors"
              >
                <span className="material-symbols-outlined text-[16px] text-primary-container">password</span>
                Change Password
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="w-full text-left px-4 py-2 hover:bg-slate-800/60 text-error flex items-center gap-2.5 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">logout</span>
                {isLoggingOut ? "Signing out…" : "Log Out"}
              </button>
            </div>
          </>,
          document.body
        )}

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}