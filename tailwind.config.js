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
        // These CSS variables are defined by next/font in app/layout.tsx —
        // Tailwind doesn't load the fonts itself, it just points at them.
        sans: ["var(--font-inter)", "sans-serif"],
        display: ["var(--font-jetbrains-mono)", "monospace"],
      },
    },
  },
  plugins: [],
};