"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  loadAdminSettings,
  saveAdminSettings,
  type AdminSettings,
} from "./adminSettings";

/**
 * Previously each screen called loadAdminSettings() once, in its own
 * mount effect — that only reads localStorage as it stood when THAT
 * component happened to mount, so a change made on the Admin screen
 * wouldn't show up on the Station Map (or the header's SSE badge) until
 * you navigated away and back, or hard-refreshed. This context holds one
 * shared, live copy of the settings so every consumer re-renders the
 * instant something changes — no refresh needed.
 *
 * Starts at DEFAULT_SETTINGS and syncs from localStorage in an effect
 * (same "avoid SSR/localStorage hydration mismatch" pattern used
 * elsewhere in this app, e.g. LiveClock.tsx) rather than reading
 * localStorage during the initial render.
 */
interface AdminSettingsContextValue {
  settings: AdminSettings;
  updateSettings: (next: AdminSettings) => void;
}

const AdminSettingsContext = createContext<AdminSettingsContextValue | null>(null);

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadAdminSettings());
  }, []);

  function updateSettings(next: AdminSettings) {
    setSettings(next);
    saveAdminSettings(next);
  }

  const value = useMemo(() => ({ settings, updateSettings }), [settings]);

  return <AdminSettingsContext.Provider value={value}>{children}</AdminSettingsContext.Provider>;
}

export function useAdminSettings() {
  const ctx = useContext(AdminSettingsContext);
  if (!ctx) {
    throw new Error("useAdminSettings must be used within an AdminSettingsProvider");
  }
  return ctx;
}