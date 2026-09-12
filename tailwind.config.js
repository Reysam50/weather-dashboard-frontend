/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Copied exactly from WeatherNode's tailwind.config.js so charts,
        // status badges, and accents stay visually consistent with the
        // dashboard we're emulating.
        weather: {
          dark: "#0f1419",
          card: "#1a2332",
          accent: "#3b82f6",
          warm: "#f59e0b",
          cold: "#06b6d4",
          rain: "#6366f1",
        },
      },
      fontFamily: {
        // These CSS variables are defined by next/font in app/layout.tsx.
        // The fallback lives INSIDE var(...) as its second argument,
        // rather than as separate items in this array — that's not just
        // style preference: `font-family: var(--font-inter), sans-serif`
        // does NOT fall back to sans-serif if --font-inter is ever
        // undefined (e.g. a transient failure fetching the Google Font
        // during a dev-server rebuild) — an unresolved var() invalidates
        // the WHOLE property, not just that one slot in the list, so the
        // browser falls back to its own default (often a serif font).
        // var(--font-inter, ui-sans-serif, ...) fixes that: the fallback
        // after the comma is part of var()'s own resolution, so it kicks
        // in correctly even when the variable is missing.
        sans: ["var(--font-inter, ui-sans-serif, system-ui, sans-serif)"],
        display: ["var(--font-jetbrains-mono, ui-monospace, monospace)"],
      },
    },
  },
  plugins: [],
};