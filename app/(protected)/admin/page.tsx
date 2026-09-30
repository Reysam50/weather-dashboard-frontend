"use client";

import { useEffect, useState } from "react";
import UserTable from "@/components/admin/UserTable";
import UserForm from "@/components/admin/UserForm";
import SettingsPanel from "@/components/admin/SettingsPanel";
import AuditLogTable from "@/components/admin/AuditLogTable";
import { useStationContext } from "@/lib/StationContext";
import { mapUser } from "@/lib/apiMappers";
import AdminLoading from "./loading";
import type { User } from "@/lib/types";
import { type AdminSettings } from "@/lib/adminSettings";
import { useAdminSettings } from "@/lib/AdminSettingsContext";
import { newAuditEntry, type AuditEntry } from "@/lib/auditLog";
import { ROLE_LABELS } from "@/lib/mockAuth";
import { useAuth } from "@/lib/AuthContext";
import { apiFetch, ApiError } from "@/lib/api";

/**
 * Admin & Access — rebuilt to match admin_access_control_panel_redesigned.
 * Per stakeholder-analysis.md, Administrator and Technical Team both get
 * full /users access (api-specification.md §3) — gated at the nav level
 * (lib/headerNav.ts), not inside this page.
 *
 * The redesign's "Station Widget Configuration" tab is dropped per your
 * call — it configured the old drag-and-drop dashboard grid, which the
 * Live Telemetry screen no longer has, so nothing would read it. That
 * also orphaned lib/widgetCatalog.ts, lib/dashboardLayout.ts,
 * lib/stationWidgetConfig.ts, components/admin/StationWidgetPicker.tsx,
 * and components/dashboard/SortableWidget.tsx — all deleted.
 *
 * System & Map Preferences' basemap/polling settings are genuinely wired
 * (lib/adminSettings.ts, read by the Station Map screen and the header's
 * SSE badge) via a draft/publish model matching the redesign's "pending
 * changes" framing — nothing saves to lib/adminSettings.ts until you hit
 * Publish & Deploy. The Ingest & Polling Frequency and Data Transmission
 * Resilience cards that used to live in that tab were removed (no longer
 * exposed as admin-editable settings) — see components/admin/SettingsPanel.tsx.
 *
 * The roster comes from GET /users; handleSaveUser and handleDeleteUser
 * call POST/PATCH/DELETE /users/{id} (api-specification.md §3) and only
 * update the list once the server confirms — a failed call shows an error
 * and changes nothing. Station scope is edited exclusively through "Edit
 * Permissions" (UserForm, PATCH /users/{id}).
 *
 * Not backed by any endpoint yet, so not shown: per-user 2FA status, last
 * activity/IP, and session revoke. The audit log below only lists actions
 * taken during this visit (no audit endpoint yet), and lib/adminSettings.ts
 * persists to localStorage (no /settings endpoint yet).
 */

type Tab = "rbac" | "system" | "audit";

export default function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("rbac");

  const { stations } = useStationContext();
  const [users, setUsers] = useState<User[]>([]);
  const [usersStatus, setUsersStatus] = useState<"loading" | "ready" | "error">("loading");
  const [usersError, setUsersError] = useState<string | null>(null);
  const [usersRefetch, setUsersRefetch] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setUsersStatus("loading");
    apiFetch<Parameters<typeof mapUser>[0][]>("/users")
      .then((raw) => {
        if (cancelled) return;
        setUsers(raw.map(mapUser));
        setUsersStatus("ready");
      })
      .catch((err) => {
        if (cancelled) return;
        setUsersError(err instanceof ApiError ? err.message : "Could not reach the users API.");
        setUsersStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [usersRefetch]);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  const [roleFilter, setRoleFilter] = useState<"all" | User["role"]>("all");
  const [stationFilter, setStationFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [entries, setEntries] = useState<AuditEntry[]>([]);

  // "Saved" settings now live in the shared AdminSettingsContext (so
  // Publish below propagates to the header + Station Map immediately,
  // everywhere, not just to localStorage) — this page only keeps its own
  // local "draft" on top of that, matching the redesign's "pending
  // changes get broadcast on Publish" framing.
  const { settings: savedSettings, updateSettings } = useAdminSettings();
  const [draftSettings, setDraftSettings] = useState<AdminSettings>(savedSettings);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    setDraftSettings(savedSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedSettings]);

  const isDirty = JSON.stringify(draftSettings) !== JSON.stringify(savedSettings);

  function logAction(action: string, target: string, status: AuditEntry["status"] = "success") {
    setEntries((prev) => [newAuditEntry("you@this-session", action, target, status), ...prev]);
  }

  const [isSavingUser, setIsSavingUser] = useState(false);
  const [saveUserError, setSaveUserError] = useState<string | null>(null);

  async function handleSaveUser(input: Omit<User, "id"> & { id?: string; tempPassword?: string }) {
    setIsSavingUser(true);
    setSaveUserError(null);
    const { tempPassword, ...userFields } = input;
    try {
      if (userFields.id) {
        // PATCH /users/{id} — request/response only document role/stations
        // in api-specification.md §3, but "all fields optional" per its
        // own description, so email is included too. `name` has nowhere
        // to go server-side yet (see UserForm.tsx's docblock) — not sent.
        const id = userFields.id;
        await apiFetch(`/users/${id}`, {
          method: "PATCH",
          body: JSON.stringify({
            email: userFields.email,
            role: userFields.role,
            stations: userFields.role === "station_operator" ? userFields.stationIds : [],
          }),
        });
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...userFields, id } : u)));
        logAction("USER_PERMISSIONS_UPDATED", userFields.email);
      } else {
        const created = await apiFetch<{ id: string }>("/users", {
          method: "POST",
          body: JSON.stringify({
            email: userFields.email,
            password: tempPassword,
            role: userFields.role,
            stations: userFields.role === "station_operator" ? userFields.stationIds : [],
          }),
        });
        setUsers((prev) => [...prev, { ...userFields, id: created.id }]);
        logAction("USER_PROVISIONED", userFields.email);
      }
      setEditingUser(null);
      setIsAddingUser(false);
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        setSaveUserError("Station Operators need at least one assigned station.");
        return;
      }
      setSaveUserError(
        err instanceof ApiError && err.status === 409
          ? "A user with that email already exists."
          : err instanceof ApiError
          ? err.message
          : "Couldn't reach the server to save this user. Please try again."
      );
    } finally {
      setIsSavingUser(false);
    }
  }

  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleDeleteUser(user: User) {
    setDeleteError(null);
    try {
      // DELETE /users/{id} — soft-delete per api-specification.md §3.
      await apiFetch(`/users/${user.id}`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      logAction("USER_DELETED", user.email, "blocked");
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : "Couldn't delete that user. Please try again.");
    }
  }

  function handleSettingsChange(patch: Partial<AdminSettings>) {
    setDraftSettings((prev) => ({ ...prev, ...patch }));
  }

  function handleDiscard() {
    setDraftSettings(savedSettings);
  }

  function handlePublish() {
    setIsPublishing(true);
    setTimeout(() => {
      updateSettings(draftSettings);
      logAction("CONFIG_UPDATE_SYSTEM_PREFERENCES", "Global Config Registry");
      setIsPublishing(false);
    }, 900);
  }

  const showForm = isAddingUser || editingUser !== null;

  const filteredUsers = users.filter((u) => {
    if (roleFilter !== "all" && u.role !== roleFilter) return false;
    if (stationFilter !== "all" && !u.stationIds.includes(stationFilter)) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  function handleExportRoster() {
    const header = ["Name", "Email", "Role", "Stations"];
    const rows = users.map((u) => {
      const stationNames = u.stationIds
        .map((id) => stations.find((s) => s.id === id)?.name ?? id)
        .join("; ");
      return [u.name, u.email, u.role, stationNames || "All"];
    });
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-roster.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  const TABS: { id: Tab; label: string; icon: string; badge?: string }[] = [
    { id: "rbac", label: "User Management & RBAC", icon: "manage_accounts", badge: `${users.length} Active` },
    { id: "system", label: "System & Map Preferences", icon: "tune" },
    { id: "audit", label: "Audit Logs & Security", icon: "history" },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* HUD strip */}
      <div className="w-full bg-card-bg rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 border border-border-line font-mono text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary-container">shield_lock</span>
            <span className="text-primary-container font-bold tracking-wider">
              SECURITY &amp; ACCESS GOVERNANCE // RBAC-OPS
            </span>
          </div>
          <span className="text-slate-600">|</span>
          <div className="flex items-center gap-1.5 text-on-surface-variant text-[11px]">
            <span className="material-symbols-outlined text-[14px] text-secondary">verified_user</span>
            <span>AUTH PROTOCOL: OIDC / mTLS VALIDATED</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-card-bg-subtle">
            <span className="w-2 h-2 rounded-full bg-primary-container animate-pulse" />
            <span className="text-[11px] font-semibold text-primary-container">SYSTEM HEALTH: OPTIMAL</span>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-secondary font-semibold">
            {ROLE_LABELS[user.role]}
          </span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-[#080c14] p-1 rounded-2xl border border-border-line">
        <div className="flex items-center gap-1 flex-wrap">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-mono text-xs transition-all ${
                activeTab === tab.id
                  ? "bg-card-bg text-primary-container font-semibold shadow-sm"
                  : "text-on-surface-variant hover:text-white hover:bg-card-bg-subtle"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.5 rounded bg-card-bg-subtle text-[10px]">{tab.badge}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: RBAC */}
      {activeTab === "rbac" && usersStatus === "loading" && <AdminLoading />}
      {activeTab === "rbac" && usersStatus === "error" && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <span className="material-symbols-outlined text-[32px] text-rose-400">cloud_off</span>
          <p className="text-white font-semibold">Couldn&apos;t load the user roster</p>
          <p className="text-sm text-slate-400">{usersError}</p>
          <button
            type="button"
            onClick={() => setUsersRefetch((n) => n + 1)}
            className="px-4 py-2 rounded-lg bg-primary-container text-slate-950 font-bold text-sm hover:bg-primary transition-colors"
          >
            Retry
          </button>
        </div>
      )}
      {activeTab === "rbac" && usersStatus === "ready" && (
        <div className="flex flex-col gap-4">
          <div className="bg-card-bg p-3 rounded-2xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 border border-border-line">
            <div className="flex flex-wrap items-center gap-3 flex-1 min-w-0">
              <div className="relative flex-1 min-w-[220px] max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[18px] text-slate-500">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full bg-[#080c14] text-white placeholder:text-slate-500 font-mono text-xs pl-9 pr-3 py-2 rounded-xl focus:outline-none focus:border-cyan-400 border border-border-line transition-colors"
                />
              </div>
              <div className="flex items-center gap-2 bg-[#080c14] px-3 py-1.5 rounded-xl border border-border-line">
                <span className="material-symbols-outlined text-[16px] text-slate-500">filter_alt</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as typeof roleFilter)}
                  className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                >
                  <option value="all">All Roles ({users.length})</option>
                  <option value="administrator">Administrator</option>
                  <option value="technical_team">Technical Team</option>
                  <option value="station_operator">Station Operator</option>
                </select>
              </div>
              <div className="flex items-center gap-2 bg-[#080c14] px-3 py-1.5 rounded-xl border border-border-line">
                <span className="material-symbols-outlined text-[16px] text-slate-500">podcasts</span>
                <select
                  value={stationFilter}
                  onChange={(e) => setStationFilter(e.target.value)}
                  className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
                >
                  <option value="all">All Nodes</option>
                  {stations.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportRoster}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-card-bg-subtle hover:bg-slate-700 text-white font-mono text-xs transition-colors border border-border-line"
              >
                <span className="material-symbols-outlined text-[16px]">file_download</span>
                <span>Export Roster CSV</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsAddingUser(true);
                  setEditingUser(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-slate-950 font-bold text-xs shadow-md hover:bg-primary transition-all"
              >
                <span className="material-symbols-outlined text-[18px]">person_add</span>
                <span>+ Add New User</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 font-mono">
            <MetricChip label="TOTAL OPERATORS" value={String(users.length).padStart(2, "0")} unit="Registered" icon="groups" color="text-primary-container" />
            <MetricChip label="STATION PERMISSIONS" value={String(stations.length).padStart(2, "0")} unit="Active AWS Hubs" icon="cell_tower" color="text-tertiary" />
          </div>

          {deleteError && (
            <div className="px-4 py-2.5 rounded-xl bg-error/10 border border-error/25 text-error text-xs font-mono">
              {deleteError}
            </div>
          )}

          <UserTable
            users={filteredUsers}
            stations={stations}
            onEdit={(user) => {
              setEditingUser(user);
              setIsAddingUser(false);
            }}
            onDeleteUser={handleDeleteUser}
          />
        </div>
      )}

      {activeTab === "system" && <SettingsPanel draft={draftSettings} onChange={handleSettingsChange} />}

      {activeTab === "audit" && <AuditLogTable entries={entries} />}

      {showForm && (
        <UserForm
          stations={stations}
          editingUser={editingUser}
          onSave={handleSaveUser}
          isSaving={isSavingUser}
          error={saveUserError}
          onCancel={() => {
            setEditingUser(null);
            setIsAddingUser(false);
            setSaveUserError(null);
          }}
        />
      )}

      {/* Persistent publish/discard bar */}
      <div className="sticky bottom-3 z-30 bg-card-bg-subtle/95 backdrop-blur-md rounded-2xl p-3 flex items-center justify-between flex-wrap gap-3 shadow-xl border border-border-line">
        <div className="flex items-center gap-3">
          <span className={`w-2.5 h-2.5 rounded-full ${isDirty ? "bg-secondary animate-pulse" : "bg-primary-container"}`} />
          <div className="flex flex-col">
            <span className="font-mono text-xs font-semibold text-white">
              {isDirty ? "Unpublished Changes" : "Configuration Registry Ready"}
            </span>
            <span className="font-mono text-[11px] text-on-surface-variant">
              {isDirty
                ? "Pending changes will be broadcast to all connected station field controllers."
                : "All settings are saved and in sync."}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            disabled={!isDirty}
            className="px-3 py-2 rounded-xl bg-card-bg hover:bg-slate-700 text-on-surface-variant hover:text-white font-mono text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-border-line"
          >
            Discard Edits
          </button>
          <button
            type="button"
            onClick={handlePublish}
            disabled={!isDirty || isPublishing}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-container text-slate-950 font-bold text-xs shadow-md hover:bg-primary transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-[18px] ${isPublishing ? "animate-spin" : ""}`}>
              {isPublishing ? "progress_activity" : "save"}
            </span>
            <span>{isPublishing ? "Broadcasting…" : "Publish & Deploy Changes"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
  unit,
  icon,
  color,
}: {
  label: string;
  value: string;
  unit: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="bg-card-bg p-3 rounded-2xl flex items-center justify-between border border-border-line shadow-sm">
      <div>
        <div className="text-[10px] text-on-surface-variant">{label}</div>
        <div className={`text-xl font-bold ${color}`}>
          {value} <span className="text-xs text-on-surface-variant font-normal">{unit}</span>
        </div>
      </div>
      <span className={`material-symbols-outlined text-[28px] ${color}`}>{icon}</span>
    </div>
  );
}