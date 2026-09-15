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
      <head>
        {/* Material Symbols isn't one of next/font's bundled Google fonts,
            so unlike Inter/JetBrains Mono above it's loaded the plain
            <link> way — same as the Stitch mockups do it. Every icon in
            the redesigned screens (<span class="material-symbols-outlined">)
            depends on this being present. */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface-base text-on-surface font-sans min-h-screen">
        {children}
      </body>
    </html>
  );
}