"use client";

import { useEffect, useState } from "react";
import UserTable from "@/components/admin/UserTable";
import UserForm from "@/components/admin/UserForm";
import SettingsPanel from "@/components/admin/SettingsPanel";
import StationWidgetPicker from "@/components/admin/StationWidgetPicker";
import { mockStations } from "@/lib/mockStations";
import { mockUsers } from "@/lib/mockUsers";
import type { User } from "@/lib/types";
import { loadAdminSettings, saveAdminSettings } from "@/lib/adminSettings";

/**
 * Admin panel — user management, system settings, and per-station widget
 * configuration.
 *
 * Per stakeholder-analysis.md, Administrator's role explicitly includes
 * "manage users, assign roles/permissions... configure system-wide
 * settings." Both Administrator and Technical Team can reach this page
 * (api-specification.md §3 grants /users to both) — gated at the nav
 * level in lib/navigation.ts, not inside this page.
 *
 * The Widgets tab is the ThingsBoard-style "pick which widgets are
 * available per station" feature — see lib/widgetCatalog.ts for the
 * available widget list and lib/stationWidgetConfig.ts for how a
 * selection is persisted and read back by the dashboard.
 *
 * TODO (frontend developer):
 * - replace mockUsers with a real GET /users fetch
 * - wire UserForm's onSave to POST /users (new) or PATCH /users/{id} +
 *   POST /users/{id}/stations (edit)
 * - wire onDelete to DELETE /users/{id}
 * - replace lib/adminSettings.ts's / lib/stationWidgetConfig.ts's
 *   localStorage with real endpoints once they exist
 */

type Tab = "users" | "widgets" | "settings";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Same "start neutral, load the real value after mounting" pattern as
  // LiveClock.tsx and the dashboard's widget order — localStorage doesn't
  // exist during server-side render.
  const [mapTheme, setMapTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setMapTheme(loadAdminSettings().mapTheme);
  }, []);

  function handleMapThemeChange(theme: "light" | "dark") {
    setMapTheme(theme);
    saveAdminSettings({ mapTheme: theme });
  }

  function handleSaveUser(input: Omit<User, "id"> & { id?: string }) {
    if (input.id) {
      const id = input.id;
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...input, id } : u)));
    } else {
      setUsers((prev) => [...prev, { ...input, id: crypto.randomUUID() }]);
    }
    setEditingUser(null);
    setIsAddingUser(false);
  }

  function handleDeleteUser(id: string) {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }

  const showForm = isAddingUser || editingUser !== null;

  return (
    <div>
      <h1 className="text-xl font-semibold mb-4">Admin Panel</h1>

      <div className="flex gap-2 mb-4">
        {(["users", "widgets", "settings"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                : "bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="space-y-4">
          {showForm ? (
            <UserForm
              stations={mockStations}
              editingUser={editingUser}
              onSave={handleSaveUser}
              onCancel={() => {
                setEditingUser(null);
                setIsAddingUser(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingUser(true)}
              className="btn-primary px-4 py-2 rounded-lg text-sm font-medium"
            >
              + Add User
            </button>
          )}

          <UserTable
            users={users}
            stations={mockStations}
            onEdit={(user) => {
              setEditingUser(user);
              setIsAddingUser(false);
            }}
            onDelete={handleDeleteUser}
          />
        </div>
      )}

      {activeTab === "widgets" && <StationWidgetPicker stations={mockStations} />}

      {activeTab === "settings" && (
        <SettingsPanel mapTheme={mapTheme} onMapThemeChange={handleMapThemeChange} />
      )}
    </div>
  );
}