import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// next/font downloads and self-hosts the font at build time — no runtime
// request to Google Fonts and no layout shift while it loads (unlike a
// <link> tag in <head>, which is how WeatherNode's Blade layout does it).
// `variable` exposes the font as a CSS custom property; tailwind.config.js
// maps font-sans / font-display to these variables.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Weather Dashboard",
  description: "Y-NAXII weather monitoring dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`dark ${inter.variable} ${jetbrainsMono.variable}`}
    >
      <body className="bg-weather-dark text-white font-sans min-h-screen">
        {/* Fixed gradient layer behind everything — see .weather-bg in
            globals.css. It never scrolls and never intercepts clicks. */}
        <div className="weather-bg" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}