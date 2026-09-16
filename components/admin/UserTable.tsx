"use client";

import type { User, Station } from "@/lib/types";
import { getUserSecurity } from "@/lib/userSecurity";

interface UserTableProps {
  users: User[];
  stations: Station[];
  onEdit: (user: User) => void;
  onConfigureScope: (user: User) => void;
  onToggleSession: (id: string) => void;
}

const ROLE_LABELS: Record<User["role"], string> = {
  technical_team: "Technical Team (Full Write)",
  administrator: "Administrator",
  station_operator: "Station Operator (Read/Calibrate)",
};

const ROLE_BADGE_STYLES: Record<User["role"], string> = {
  technical_team: "bg-primary-container/15 text-primary-container",
  administrator: "bg-tertiary/15 text-tertiary",
  station_operator: "bg-secondary/15 text-secondary",
};

const ROLE_DOT: Record<User["role"], string> = {
  technical_team: "bg-primary-container",
  administrator: "bg-tertiary",
  station_operator: "bg-secondary",
};

const AVATAR_STYLES: Record<User["role"], string> = {
  technical_team: "bg-primary-container text-slate-950",
  administrator: "bg-tertiary text-slate-950",
  station_operator: "bg-secondary text-slate-950",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * User & RBAC roster table — matches GET /users (api-specification.md §3).
 * Restyled to the redesign; adds the 2FA/Last-Activity/Governance columns
 * from userSecurity.ts's mock security profile overlay.
 */
export default function UserTable({
  users,
  stations,
  onEdit,
  onConfigureScope,
  onToggleSession,
}: UserTableProps) {
  function stationNames(ids: string[]) {
    if (ids.length === 0) return "—";
    return ids.map((id) => stations.find((s) => s.id === id)?.name ?? "Unknown").join(", ");
  }

  return (
    <div className="bg-card-bg rounded-2xl border border-border-line overflow-hidden shadow-md">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="bg-[#080c14] text-on-surface-variant uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4">User &amp; Identity</th>
              <th className="py-3 px-4">Official Email</th>
              <th className="py-3 px-4">Security Role</th>
              <th className="py-3 px-4">Assigned Stations</th>
              <th className="py-3 px-4">2FA / Credential</th>
              <th className="py-3 px-4">Last Activity</th>
              <th className="py-3 px-4 text-right">Governance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-line text-slate-300">
            {users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((user, i) => {
                const sec = getUserSecurity(user.id);
                return (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      i % 2 === 0 ? "bg-card-bg-subtle/40" : ""
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0 ${AVATAR_STYLES[user.role]}`}
                        >
                          {initials(user.name)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-white text-[13px]">{user.name}</span>
                            {sec.verified && (
                              <span
                                className="material-symbols-outlined text-[14px] text-primary-container"
                                title="Verified Identity"
                              >
                                verified
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-on-surface-variant">{sec.title}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-primary-container">{user.email}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded font-semibold ${ROLE_BADGE_STYLES[user.role]}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${ROLE_DOT[user.role]}`} />
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-200">
                        <span className="material-symbols-outlined text-[14px] text-slate-500">
                          {user.role === "station_operator" ? "sensors" : "hub"}
                        </span>
                        <span>
                          {user.role === "station_operator" ? stationNames(user.stationIds) : "All Stations (Network Wide)"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 ${
                          sec.twoFactorEnforced ? "text-secondary" : "text-slate-500"
                        }`}
                      >
                        <span className="material-symbols-outlined text-[14px]">
                          {sec.twoFactorEnforced ? "lock" : "lock_open"}
                        </span>
                        {sec.twoFactorEnforced ? "Enforced (FIDO2 / TOTP)" : "Not enrolled"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col">
                        <span className={sec.sessionActive ? "text-primary-container font-semibold" : "text-slate-400"}>
                          {sec.lastActivityLabel}
                        </span>
                        <span className="text-[10px] text-on-surface-variant">IP: {sec.lastActivityIp}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(user)}
                          title="Edit Permissions"
                          className="p-1.5 rounded bg-card-bg-subtle hover:bg-slate-700 text-on-surface-variant hover:text-primary-container transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onConfigureScope(user)}
                          title="Configure Station Scope"
                          className="p-1.5 rounded bg-card-bg-subtle hover:bg-slate-700 text-on-surface-variant hover:text-secondary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">tune</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => onToggleSession(user.id)}
                          title={sec.sessionActive ? "Revoke Session" : "No active session"}
                          className="p-1.5 rounded bg-card-bg-subtle hover:bg-slate-700 text-on-surface-variant hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {sec.sessionActive ? "person_off" : "person_check"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
      <div className="bg-[#080c14] px-4 py-2.5 flex items-center justify-between flex-wrap gap-2 font-mono text-[11px] text-on-surface-variant">
        <div className="flex items-center gap-2">
          <span>SHOWING {users.length} OF {users.length} REGISTERED SYSTEM OPERATORS</span>
          <span>•</span>
          <span className="text-primary-container font-semibold">ALL SESSIONS ENCRYPTED TLS 1.3</span>
        </div>
      </div>
    </div>
  );
}