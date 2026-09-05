import "./globals.css";

export const metadata = {
  title: "Weather Dashboard",
  description: "Y-NAXII weather monitoring prototype",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
