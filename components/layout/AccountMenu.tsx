"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { CURRENT_ROLE, ROLE_LABELS } from "@/lib/mockAuth";
import ChangePasswordModal from "@/components/auth/ChangePasswordModal";

/**
 * Distinct from the plain decorative avatar removed from the header
 * earlier — this one has a real job now that Change Password
 * (POST /auth/change-password) and Log Out (POST /auth/logout) both hit
 * the actual backend. Added here rather than reviving the old avatar
 * spot, since neither of those actions existed anywhere in the app until
 * now.
 */
export default function AccountMenu() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
        className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 border border-cyan-400/30 flex items-center justify-center text-white shadow-[0_0_12px_rgba(0,229,255,0.2)] flex-shrink-0"
        aria-label="Account menu"
      >
        <span className="material-symbols-outlined text-[18px]">person</span>
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close account menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40"
          />
          <div className="absolute right-0 mt-2 w-52 rounded-xl bg-[#141b2e] border border-border-line shadow-2xl z-50 py-2 font-mono text-xs">
            <div className="px-4 py-2 border-b border-border-line">
              <span className="text-white font-semibold block">{ROLE_LABELS[CURRENT_ROLE]}</span>
              <span className="text-on-surface-variant text-[10px]">Signed in</span>
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