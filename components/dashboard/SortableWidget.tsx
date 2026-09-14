"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableWidgetProps {
  id: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps one dashboard widget to make it draggable/droppable via dnd-kit,
 * and gives it a fullscreen/expand button — FR-6.2's requirement that
 * widgets be individually expandable. Added here rather than inside each
 * of the 15+ individual widget components: every widget already passes
 * through this one wrapper, so this is a single change with universal
 * coverage instead of touching every widget file.
 *
 * Only the small grip icon is the actual drag handle (attributes +
 * listeners are applied there, not on the whole card) — so buttons,
 * links, or chart tooltips inside a widget still work normally. Same
 * treatment for the expand button: a plain onClick, no drag listeners.
 * Both icons are invisible until you hover the card.
 *
 * The fullscreen modal is rendered via createPortal into document.body
 * rather than inline here — dnd-kit applies a CSS `transform` to this
 * wrapper's own div, and `transform` on an ancestor creates a new
 * containing block for any `position: fixed` descendant, which would
 * otherwise make the modal position itself relative to this small card
 * instead of the actual viewport. Escaping to document.body sidesteps
 * that entirely.
 *
 * Known limitation: the widget is rendered a second time inside the
 * modal (simplest way to show it larger, at the cost of briefly mounting
 * two instances of the same chart while fullscreen is open) — the
 * fullscreen view is a bigger, isolated presentation of the widget's
 * existing content, not a widget-specific "large mode" with taller
 * internal charts. That would need each chart widget to accept its own
 * height override, which is a larger follow-up if you want charts
 * specifically (not just tables) to render meaningfully bigger here.
 */
export default function SortableWidget({
  id,
  className = "",
  children,
}: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });
  const [isFullscreen, setIsFullscreen] = useState(false);

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <>
      <div ref={setNodeRef} style={style} className={`relative group ${className}`}>
        <div className="absolute top-3 right-3 z-10 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setIsFullscreen(true)}
            aria-label="Expand widget"
            className="p-1 rounded cursor-pointer text-gray-500 hover:text-gray-300 hover:bg-white/10"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Drag to reorder widget"
            // touch-none stops the browser's own touch scrolling from
            // fighting the drag gesture on mobile — dnd-kit needs this on
            // whatever element the pointer/touch listeners are attached to.
            className="p-1 rounded cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 hover:bg-white/10 touch-none"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <circle cx="6" cy="5" r="1.5" />
              <circle cx="14" cy="5" r="1.5" />
              <circle cx="6" cy="10" r="1.5" />
              <circle cx="14" cy="10" r="1.5" />
              <circle cx="6" cy="15" r="1.5" />
              <circle cx="14" cy="15" r="1.5" />
            </svg>
          </button>
        </div>
        {children}
      </div>

      {isFullscreen &&
        createPortal(
          <div
            className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 md:p-8"
            onClick={() => setIsFullscreen(false)}
          >
            <div
              className="w-full max-w-5xl max-h-[85vh] overflow-y-auto relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                aria-label="Close"
                className="absolute -top-3 -right-3 z-10 bg-weather-card border border-white/10 rounded-full p-1.5 text-gray-300 hover:text-white hover:bg-white/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
              {children}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}