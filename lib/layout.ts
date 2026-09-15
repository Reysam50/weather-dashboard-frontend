/**
 * Single source of truth for the page's max width + horizontal padding.
 * AppHeader's inner wrapper and app/(protected)/layout.tsx's <main> both
 * use this exact string so the header and page content always align —
 * previously they duplicated "max-w-[1440px] mx-auto px-6" in two places,
 * which is an easy way for them to quietly drift apart.
 */
export const PAGE_CONTAINER = "max-w-[1440px] mx-auto px-6";
