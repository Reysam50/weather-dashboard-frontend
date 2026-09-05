/**
 * Station Management Map UI — FR-12.
 *
 * Visibility/permissions (CONFIRMED, stakeholder-analysis.md):
 * - Technical Team: full access — add, remove, edit stations/equipment, plus
 *   everything Administrator can do (select, search, compare)
 * - Administrator: read-only — select, search, compare. No write controls render.
 * - Station Operator: no access to this page at all.
 *
 * This is also the station-provisioning mechanism (integration-boundary.md §5) —
 * pairing a physical station's Particle device ID with a station record happens
 * here, Technical Team only.
 */
export default function StationsPage() {
  // TODO (frontend developer): render components/map/* (Leaflet + OpenStreetMap),
  // gate add/edit/remove controls on role from GET /auth/me. Remember: this is
  // a UX nicety, not the real security boundary — the backend enforces it too.
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Station Management</h1>
      <p className="text-gray-500">Map placeholder — see README.md.</p>
    </main>
  );
}
