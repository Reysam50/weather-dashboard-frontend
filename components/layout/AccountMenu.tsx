"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ROLE_LABELS } from "@/lib/mockAuth";
import { useAuth } from "@/lib/AuthContext";
import { mockStations } from "@/lib/mockStations";
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
 */
export default function AccountMenu() {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
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

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Even if the request fails, still send them to /login — a stale
      // cookie client-side is a lesser problem than being stuck.
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-400/30 flex items-center justify-center text-white font-mono text-xs font-bold shadow-[0_0_12px_rgba(0,229,255,0.2)] flex-shrink-0"
        aria-label="Account menu"
      >
        {initials(user.email)}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
          <div className="absolute right-0 mt-2 w-64 rounded-xl bg-[#141b2e] border border-border-line shadow-2xl z-50 py-2 font-mono text-xs">
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
        </>
      )}

      {showChangePassword && <ChangePasswordModal onClose={() => setShowChangePassword(false)} />}
    </div>
  );
}