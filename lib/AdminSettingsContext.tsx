"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_SETTINGS,
  fetchRemoteSettings,
  loadAdminSettings,
  saveAdminSettings,
  saveRemoteSettings,
  type AdminSettings,
} from "./adminSettings";

/**
 * One shared, live copy of the system settings so every consumer (Station
 * Map theme, dashboard tolerance panels) re-renders the instant something
 * changes.
 *
 * Source of truth is now the backend (GET/PATCH /settings): on mount we show
 * the cached copy straight away (avoids an SSR/localStorage hydration
 * mismatch and a blank flash), then overlay whatever the server returns.
 * If that GET fails we just keep the cached/default values — a settings
 * hiccup shouldn't break the dashboard.
 *
 * updateSettings() only commits locally AFTER the server accepts the
 * change, and throws if it doesn't, so the Admin screen can show the error
 * and keep the draft instead of pretending it was published.
 */
interface AdminSettingsContextValue {
  settings: AdminSettings;
  updateSettings: (next: AdminSettings) => Promise<void>;
}

const AdminSettingsContext = createContext<AdminSettingsContextValue | null>(null);

export function AdminSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    const cached = loadAdminSettings();
    setSettings(cached);
    let cancelled = false;
    fetchRemoteSettings(cached)
      .then((remote) => {
        if (cancelled) return;
        setSettings(remote);
        saveAdminSettings(remote);
      })
      .catch(() => {
        // Keep the cached values — see above.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function updateSettings(next: AdminSettings) {
    const saved = await saveRemoteSettings(next); // throws on failure
    setSettings(saved);
    saveAdminSettings(saved);
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
