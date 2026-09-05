/**
 * Main dashboard — per-station widget grid.
 * See dashboard-reference-analysis.md §2 for the confirmed widget set:
 * time-series tables, big-number cards with sparkline, line chart with
 * time-range slider, banded range chart, multi-series line/pie/bar with
 * live legends. Two data domains required: temperature/humidity and rainfall.
 *
 * Role-gated behavior (stakeholder-analysis.md):
 * - Station Operator: sees only their assigned station(s), no comparison view
 * - Administrator / Technical Team: can select any station, use comparison (FR-2.2)
 */
export default function DashboardPage() {
  // TODO (frontend developer): fetch GET /auth/me for role + permitted stations,
  // render widget grid using components/widgets/*, wire up lib/websocket.ts
  // for live updates per system-architecture.md §4.
  return (
    <main className="p-8">
      <h1 className="text-xl font-semibold">Dashboard</h1>
      <p className="text-gray-500">Widget grid placeholder — see README.md.</p>
    </main>
  );
}
