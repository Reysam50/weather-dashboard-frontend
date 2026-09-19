"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNotifications } from "@/lib/NotificationsContext";
import { SEVERITY_STYLES } from "@/lib/notifications";
import { useHydrated } from "@/lib/useHydrated";
import { formatTimeAgo } from "@/lib/formatTimeAgo";

/**
 * Rendered via a portal straight into document.body — this used to be a
 * plain child of AppHeader.tsx's <header>, but that element has
 * `position: sticky` + `z-index: 50`, which makes it establish its own
 * stacking context. Every descendant's z-index (including this panel's,
 * however high) only ever gets compared *inside* that context, so the
 * whole header — panel included — was capped at z-50 as a unit against
 * the rest of the page, and page content with its own stacking context
 * (any positioned element with a z-index, which several cards have) could
 * end up painted on top of it. Portaling escapes that entirely instead of
 * chasing z-index numbers.
 */
export default function NotificationsPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const hydrated = useHydrated();
  // Drives the slide-in transition — starts closed, flips true a tick
  // after mount so the panel actually animates in instead of just
  // appearing already in place.
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  function handleClose() {
    setEntered(false);
    setTimeout(onClose, 200);
  }

  return createPortal(
    <div className="fixed inset-0 z-[1100]">
      <button
        type="button"
        aria-label="Close notifications"
        onClick={handleClose}
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200 ${
          entered ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-sm bg-card-bg border-l border-border-line shadow-2xl flex flex-col transition-transform duration-200 ease-out ${
          entered ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-border-line flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[20px]">notifications</span>
            Notifications
          </h2>
          <button type="button" onClick={handleClose} className="text-on-surface-variant hover:text-white transition-colors" aria-label="Close">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {notifications.length > 0 && (
          <div className="px-5 py-2.5 border-b border-border-line flex justify-end">
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-mono text-primary-container hover:text-primary"
            >
              Mark all as read
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-on-surface-variant text-sm">You&apos;re all caught up.</div>
          ) : (
            <ul className="divide-y divide-border-line">
              {notifications.map((n) => {
                const style = SEVERITY_STYLES[n.severity];
                return (
                  <li
                    key={n.id}
                    onClick={() => !n.read && markAsRead(n.id)}
                    className={`p-4 flex gap-3 cursor-pointer transition-colors ${
                      n.read ? "opacity-60 hover:opacity-100" : "bg-card-bg-subtle/40"
                    } hover:bg-card-bg-subtle`}
                  >
                    <span className={`material-symbols-outlined text-[20px] mt-0.5 ${style.color}`}>{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-white">{n.title}</span>
                        {!n.read && <span className="w-2 h-2 rounded-full bg-primary-container flex-shrink-0" />}
                      </div>
                      <p className="text-xs text-on-surface-variant mt-0.5">{n.message}</p>
                      <span className="text-[10px] font-mono text-on-surface-variant/70 block mt-1">
                        {hydrated ? formatTimeAgo(n.timestamp) : "—"}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(n.id);
                      }}
                      className="text-on-surface-variant hover:text-error transition-colors flex-shrink-0"
                      aria-label="Delete notification"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}