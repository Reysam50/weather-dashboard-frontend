"use client";

import type { User, Station } from "@/lib/types";

interface UserTableProps {
  users: User[];
  stations: Station[];
  onEdit: (user: User) => void;
  onDelete: (id: string) => void;
}

const ROLE_LABELS: Record<User["role"], string> = {
  technical_team: "Technical Team",
  administrator: "Administrator",
  station_operator: "Station Operator",
};

const ROLE_BADGE_STYLES: Record<User["role"], string> = {
  technical_team: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  administrator: "bg-purple-600/20 text-purple-400 border-purple-500/30",
  station_operator: "bg-white/10 text-gray-300 border-white/10",
};

/**
 * User management table — matches GET /users (api-specification.md §3).
 * Administrator and Technical Team both have full access to this endpoint
 * per the spec, so there's no additional role-gating inside this
 * component beyond the page/nav deciding whether to render it at all.
 */
export default function UserTable({
  users,
  stations,
  onEdit,
  onDelete,
}: UserTableProps) {
  function stationNames(ids: string[]) {
    if (ids.length === 0) return "—";
    return ids
      .map((id) => stations.find((s) => s.id === id)?.name ?? "Unknown")
      .join(", ");
  }

  return (
    <div className="bg-weather-card rounded-2xl border border-white/10 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-white/5">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Role</th>
              <th className="px-4 py-3 text-left font-medium text-gray-400">Stations</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-gray-500">
                  No users yet.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-gray-400">{user.email}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded text-xs border ${ROLE_BADGE_STYLES[user.role]}`}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {user.role === "station_operator"
                      ? stationNames(user.stationIds)
                      : "All"}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onEdit(user)}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium mr-3"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(user.id)}
                      className="text-gray-500 hover:text-red-400 text-xs font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}