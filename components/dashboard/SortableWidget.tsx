"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface SortableWidgetProps {
  id: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Wraps one dashboard widget to make it draggable/droppable via dnd-kit.
 * Only the small grip icon in the top-right corner is the actual drag
 * handle (attributes + listeners are applied there, not on the whole
 * card) — so buttons, links, or chart tooltips inside a widget still work
 * normally and don't accidentally start a drag.
 *
 * The grip icon is invisible until you hover the card (`opacity-0
 * group-hover:opacity-100`), matching WeatherNode's drag handle behavior —
 * it stays out of the way until you're actually rearranging things.
 */
export default function SortableWidget({
  id,
  className = "",
  children,
}: SortableWidgetProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${className}`}>
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder widget"
        className="absolute top-3 right-3 z-10 p-1 rounded cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-300 hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity touch-none"
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
      {children}
    </div>
  );
}