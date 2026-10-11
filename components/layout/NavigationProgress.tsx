"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

/**
 * Instant feedback when the user clicks a link to another screen.
 *
 * Next only swaps the page once the next route has loaded (in dev it may
 * still be compiling it), so the old screen used to just sit there with no
 * sign the click registered. This listens for clicks on internal links and
 * immediately shows a progress bar along the top plus a small "Loading"
 * chip and a busy cursor; they finish as soon as the pathname changes.
 *
 * It works on every <Link> / <a> in the app (header tabs, mobile nav, any
 * future link) without each one needing its own pending state. It
 * deliberately ignores: modified clicks (new tab/window), target=_blank,
 * downloads, external links, hash-only links and links to the page you're
 * already on. Programmatic router.push() calls aren't covered.
 *
 * A 15s safety timeout clears the indicator if a navigation never completes
 * (e.g. the request failed), so it can't get stuck on screen.
 */
type Phase = "idle" | "loading" | "done";

const SAFETY_TIMEOUT_MS = 15_000;

function normalize(path: string) {
  return path.length > 1 ? path.replace(/\/+$/, "") : path;
}

export default function NavigationProgress() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<Phase>("idle");
  const currentPath = useRef(pathname);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Start on link click.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;

      let url: URL;
      try {
        url = new URL(anchor.href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;
      if (normalize(url.pathname) === normalize(currentPath.current)) return;

      if (doneTimer.current) clearTimeout(doneTimer.current);
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      setPhase("loading");
      safetyTimer.current = setTimeout(() => setPhase("idle"), SAFETY_TIMEOUT_MS);
    }
    // Capture phase so we see the click even if a component stops propagation.
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  // Finish when the route actually changes.
  useEffect(() => {
    currentPath.current = pathname;
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    setPhase((p) => {
      if (p !== "loading") return p;
      doneTimer.current = setTimeout(() => setPhase("idle"), 350);
      return "done";
    });
  }, [pathname]);

  // Busy cursor while loading.
  useEffect(() => {
    document.body.style.cursor = phase === "loading" ? "progress" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [phase]);

  useEffect(
    () => () => {
      if (safetyTimer.current) clearTimeout(safetyTimer.current);
      if (doneTimer.current) clearTimeout(doneTimer.current);
    },
    []
  );

  if (phase === "idle") return null;

  return (
    <>
      <style>{`
        @keyframes nav-progress-grow { from { width: 0%; } to { width: 88%; } }
        @keyframes nav-progress-spin { to { transform: rotate(360deg); } }
      `}</style>
      <div
        role="progressbar"
        aria-label="Loading page"
        className="fixed top-0 left-0 right-0 z-[2000] h-[3px] pointer-events-none"
      >
        <div
          className="h-full bg-primary-container shadow-[0_0_8px_rgba(34,211,238,0.8)]"
          style={
            phase === "done"
              ? { width: "100%", opacity: 0, transition: "width 150ms ease-out, opacity 250ms ease-out 100ms" }
              : { animation: "nav-progress-grow 8s cubic-bezier(0.1, 0.6, 0.2, 1) forwards" }
          }
        />
      </div>
      {phase === "loading" && (
        <div
          role="status"
          className="fixed top-3 right-3 z-[2000] flex items-center gap-2 px-3 py-1.5 rounded-full bg-card-bg-subtle/95 border border-border-line shadow-lg font-mono text-[11px] text-white pointer-events-none"
        >
          <span
            className="inline-block w-3 h-3 rounded-full border-2 border-primary-container border-t-transparent"
            style={{ animation: "nav-progress-spin 0.7s linear infinite" }}
          />
          Loading…
        </div>
      )}
    </>
  );
}
