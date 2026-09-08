import AppHeader from "@/components/layout/AppHeader";
import AppNav from "@/components/layout/AppNav";
import MobileNav from "@/components/layout/MobileNav";

/**
 * Shared shell for every logged-in screen — currently /dashboard and
 * /stations, and anything else we add later.
 *
 * The folder name "(protected)" is a Next.js *route group*: the parentheses
 * mean it is NOT part of the URL. app/(protected)/dashboard/page.tsx still
 * serves at exactly /dashboard — the folder only exists so these routes can
 * share this layout without /login (which should NOT have the header/nav)
 * being forced to share it too.
 *
 * TODO (frontend developer): once the login screen exists, the real auth
 * check belongs here — call GET /auth/me and redirect to /login on 401,
 * per app/page.tsx's TODO and system-architecture.md §5.
 */
export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <AppNav />
      {/* pb-24 leaves room for the fixed mobile bottom nav so it never
          covers the last bit of content on small screens; lg:pb-6 removes
          that extra space once MobileNav is hidden. */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-24 lg:pb-6">
        {children}
      </main>
      <MobileNav />
    </>
  );
}