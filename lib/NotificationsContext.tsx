"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { buildSeedNotifications, type AppNotification, type NotificationSeverity } from "./notifications";
import { useStationContext } from "./StationContext";

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  addNotification: (severity: NotificationSeverity, title: string, message: string) => void;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { stations } = useStationContext();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => buildSeedNotifications());
  const previousStatuses = useRef<Record<string, string>>({});

  function addNotification(severity: NotificationSeverity, title: string, message: string) {
    setNotifications((prev) => [
      { id: crypto.randomUUID(), severity, title, message, timestamp: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }

  // Real trigger, not just a mock seed: if a watched station's status
  // flips to offline, that's a genuine notification-worthy event. Once a
  // backend WebSocket feed exists, this same addNotification call is
  // what its message handler should invoke too — this effect is just
  // today's only source of station-status changes.
  useEffect(() => {
    stations.forEach((station) => {
      const prevStatus = previousStatuses.current[station.id];
      if (prevStatus && prevStatus !== "offline" && station.status === "offline") {
        addNotification(
          "critical",
          "Station Offline",
          `${station.name} has stopped reporting telemetry.`
        );
      }
      previousStatuses.current[station.id] = station.status;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stations]);

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const value = useMemo(
    () => ({ notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, addNotification }),
    [notifications, unreadCount]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error("useNotifications must be used within a NotificationsProvider");
  }
  return ctx;
}