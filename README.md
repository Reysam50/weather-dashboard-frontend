# Weather Dashboard — Frontend

Next.js dashboard for the Y-NAXII weather monitoring station network. Five
screens (Live Dashboard, Compare, Reports, Station Map, Admin) reading from a
mock data layer today, built so a real backend can be dropped in by setting one
`.env` variable — see **Backend integration** below.

**This repo is code only.** All planning, requirements, and architecture
documentation lives in the separate `weather-dashboard-docs` repo — read these
before writing any code, in this order:

1. `01-requirements/dashboard-reference-analysis.md` — the widget set this UI needs
   to reproduce (tables, big-number cards, line/range/pie/bar charts)
2. `01-requirements/functional-requirements.md` — FR-12 (Station Management Map),
   FR-2 (multi-station comparison), FR-8/FR-9 (export/reports UI)
3. `00-project-management/stakeholder-analysis.md` — the 3-role permission model;
   which UI controls are visible to which role
4. `02-architecture/system-architecture.md` §8 — frontend structure decisions
5. `02-architecture/api-specification.md` — every endpoint this UI calls, and
   §9 specifically — a per-screen map of what each screen needs from the API
6. `02-architecture/database-design.md` — schema backing the API above
7. `05-development/coding-standards.md`, `git-workflow.md`

If code here and the docs repo ever disagree, **the docs repo is the source of
truth** — update the docs first (see `git-workflow.md` §8), then the code.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in real values, never commit
npm run dev
```

### Environment variables (`.env.local`)

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | Base URL for every REST call (`lib/api.ts`). Same-origin deployment (ADR-0003) — typically a relative path like `/api/v1`, not a separate domain. |
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for live telemetry (`lib/websocket.ts`). **Not currently connected by any screen** — see "Known gaps" below. |
| `NEXT_PUBLIC_DEV_LOGIN_EMAIL` / `NEXT_PUBLIC_DEV_LOGIN_PASSWORD` | Dev-only login, used automatically **only** when `POST /auth/login`/`GET /auth/me` fail with a network error (no backend reachable at all) rather than a real HTTP response — see `lib/mockSession.ts`. Once a real backend exists these are never consulted. |

## Backend integration model

**Write actions** (creating/editing/deleting something) already call real,
documented endpoints (see `api-specification.md`) through `lib/api.ts`'s
`apiFetch()` — Station Map's Provision/Edit Station, and Admin's
Add/Edit/Delete User. The pattern used for all of these:

```ts
try {
  const result = await apiFetch("/some/endpoint", { method: "POST", body: ... });
  // apply the real result
} catch {
  // no backend reachable yet (network error) — fall back to updating local
  // mock state directly, so every flow is still testable end-to-end today
}
```

Point `NEXT_PUBLIC_API_BASE_URL` at a real backend and these actions start using
it automatically, with zero code changes — the fallback branch simply stops
being reached once real HTTP responses (success or error) come back instead of
a network failure.

**Reads (the data every screen displays) are not wired up yet** — Dashboard,
Compare, and Reports render entirely from static mock modules
(`lib/mockStationData.ts`, `lib/liveTelemetryData.ts`, `lib/mockReports.ts`),
and Station Map/Admin's own lists (`lib/mockStations.ts`, `lib/mockUsers.ts`)
are the same. None of these currently call `apiFetch`. `api-specification.md`
§9 documents exactly which `GET` endpoint each screen needs; wiring each mock
module up to `apiFetch` (most naturally inside `lib/StationContext.tsx` for
station data, per its own header comment) is real remaining work, not a
config flip. A handful of write actions also have no backing endpoint
documented yet at all (calibration offsets, the map's "Ping" diagnostic, admin
session-revoke) — those stay local-only regardless; see "Known gaps."

## Known gaps (found while making every screen backend-ready)

- **Wind speed/direction has no confirmed hardware field.** It's displayed
  across every screen (Live Dashboard, Compare, Reports export), but the
  hardware team's confirmed payload has no wind sensor column. Flagged as a 🟡
  open question in `api-specification.md` v3.0 §5 — needs a real answer before
  it's more than mock data.
- **`lib/websocket.ts` is fully built but never connected.** A `DashboardSocket`
  class matching the documented `/ws` contract exists, and `NEXT_PUBLIC_WS_URL`
  is already in `.env.example`, but nothing in the app instantiates it — every
  screen reads static/mock data with no live connection. Wiring this up is real
  remaining work, not a config flip.
- **No backing endpoint yet for:** station calibration offsets
  (`components/map/CalibrationDrawer.tsx`), the map's "Ping" diagnostic
  (`components/map/StationInspectPod.tsx`), or admin session-revoke
  (`components/admin/UserTable.tsx`'s session toggle). All three are
  local-only/simulated.
- **Declared but unused dependencies:** `package.json` lists `apexcharts` /
  `react-apexcharts` and `@dnd-kit/*`, but no rendered screen uses them — every
  real chart in this app is hand-rolled inline SVG (see `lib/chartPaths.ts`).
  The only file that imports ApexCharts (`components/widgets/TemperatureTrendChart.tsx`)
  is itself not rendered anywhere (kept only for its exported `TrendPoint` type
  — see below). Safe to remove these packages if bundle size matters; left in
  for now since removing them wasn't part of any requested screen fix.
- Run `node scripts/find-orphaned-files.js` any time to re-check for files that
  have drifted out of use — see that script's own header comment for how it
  works.

## Structure

```
app/(protected)/    Every real screen — dashboard, compare, reports, stations, admin
app/login/          Auth
components/         One folder per screen, plus layout/ (shared chrome) and widgets/ (legacy, mostly unused — see below)
lib/                Data (mock + real), contexts, and small framework-free utilities
scripts/            Repo-maintenance scripts (currently just the orphan finder)
```

### `app/`

| File | What it is |
|---|---|
| `layout.tsx` | Root HTML shell — fonts, `<html>`/`<body>`, wraps everything in the context providers (`AuthContext`, `StationContext`, `AdminSettingsContext`, `NotificationsContext`). |
| `page.tsx` | `/` — redirects to `/dashboard` or `/login` depending on auth state. |
| `login/page.tsx` | Login screen. |
| `(protected)/layout.tsx` | Shared chrome for every real screen: `AppHeader`, `MobileNav`, the "am I logged in" gate. The `(protected)` folder name is a route group — it doesn't appear in the URL. |
| `(protected)/dashboard/page.tsx` | Live Dashboard screen. |
| `(protected)/compare/page.tsx` | Compare screen. |
| `(protected)/reports/page.tsx` | Reports screen. |
| `(protected)/stations/page.tsx` | Station Map screen. |
| `(protected)/admin/page.tsx` | Admin & Access screen. |
| `(protected)/{dashboard,compare,reports,stations,admin}/loading.tsx` | Per-screen skeleton shown automatically by Next.js during navigation (see `components/layout/Skeleton.tsx`). |

### `components/layout/` — shared chrome, used on every screen

| File | What it is |
|---|---|
| `AppHeader.tsx` | Top nav bar: logo, screen links, station dropdown, notifications, account menu. |
| `MobileNav.tsx` | Bottom tab bar shown on small screens. |
| `StationDropdown.tsx` | The header's station picker (backed by `StationContext`). |
| `AccountMenu.tsx` | Header's user menu (profile, change password, logout). |
| `NotificationsPanel.tsx` | Header's notification bell dropdown. |
| `LiveClock.tsx` | Header's live-updating clock. |
| `SseLatencyBadge.tsx` | **Orphaned** — not rendered anywhere currently; was meant to show the live SSE interval in the header. See "Known gaps." |
| `Skeleton.tsx` | Shared skeleton-loading primitives (`Skeleton`, `SkeletonCard`, `SkeletonTable`) used by every screen's `loading.tsx`. |

### `components/dashboard/` — Live Dashboard

| File | What it is |
|---|---|
| `SearchableToggleList.tsx` | Generic searchable multi-select list — used by the Admin screen's Add/Edit User form for assigning stations to a Station Operator. |
| `live/HeroMetricsRow.tsx` | The 4 top cards: Air Temp, Humidity, Rainfall, Pressure. |
| `live/DiurnalCycleCard.tsx` | Full-day air temperature graph with the drag-to-pan/resize time window. |
| `live/FullDayTrendCard.tsx` | Generic version of the above, reused for the Humidity/Pressure/Wind Direction full-day graphs — extracted so the pan/resize/tooltip/CSV-export logic isn't duplicated per metric. |
| `live/DualGaugeRainfallCard.tsx` | Dual rain-gauge chart with the Minute/Hourly/Daily granularity toggle. |
| `live/SensorTriadCard.tsx` | Sensor-agreement panel comparing the primary air-temp sensor against BMP360/SHT31. |
| `live/AnemometerCard.tsx` | Wind speed/gust/direction compass dial + speed history sparkline. |
| `live/SynopticOutlookCard.tsx` | 7-day forecast strip + prevailing wind/rain-outlook footer. |
| `live/TelemetryLogTable.tsx` | "Telemetry Ingest Archive" — last 60 minute-level readings, CSV export. |

### `components/compare/`

| File | What it is |
|---|---|
| `StationSummaryCards.tsx` | Per-station current-reading summary cards at the top of the screen. |
| `MultiStationTrendChart.tsx` | Generic multi-station line chart — reused for temperature, humidity, pressure, rainfall, wind speed, and wind direction. |
| `FindingsRibbon.tsx` | The auto-generated "findings" text strip above the matrix table. |
| `ComparisonMatrixTable.tsx` | The Comparative Telemetry Analytics Matrix — high/low/avg per metric per station. |
| `AddStationModal.tsx` | "Add station to comparison" picker. |

### `components/reports/`

| File | What it is |
|---|---|
| `QuickExportCard.tsx` | One-off CSV/XLS/XLSX/PDF export with a telemetry-channel checklist. |
| `ScheduleReportCard.tsx` | Scheduled Automated Reports — daily/weekly/monthly/custom (custom now has a real date+time picker). |
| `StationScopeSelect.tsx` | Shared station-or-all-stations dropdown, used by both export and schedule cards. |
| `GeneratedReportsCard.tsx` | List of previously generated reports with download links. |
| `ManualRecoveryUploadCard.tsx` | Manual SD-card CSV upload (FR-11.3). |

### `components/map/`

| File | What it is |
|---|---|
| `StationMap.tsx` | The Leaflet map itself — markers, click-to-place, pending-marker preview. |
| `StationInspectPod.tsx` | Floating panel shown when a map pin is selected — current readings, Edit/Calibrate/Ping actions. |
| `ProvisionStationModal.tsx` | "Add a new station" form (name, device ID, pick location on map). |
| `EditStationModal.tsx` | Edit an existing station's name/device ID/coordinates, with the same "re-pick on map" flow as provisioning. |
| `CalibrationDrawer.tsx` | Side drawer for setting a station's temp/pressure calibration offsets (local-only — see "Known gaps"). |
| `FleetInventoryTable.tsx` | Table of every station with Edit/Calibrate row actions. |

### `components/admin/`

| File | What it is |
|---|---|
| `UserTable.tsx` | User roster — Edit/Delete/session-toggle row actions. |
| `UserForm.tsx` | Add/Edit user modal (role, station scope for Station Operators). |
| `SettingsPanel.tsx` | System & Map Preferences tab — basemap theme, sensor-agreement and rain-gauge-variance tolerances. |
| `AuditLogTable.tsx` | Read-only audit log of admin actions. |

### `components/auth/`

| File | What it is |
|---|---|
| `ChangePasswordModal.tsx` | Change-password form (header's account menu). |
| `ForgotPasswordModal.tsx` | Forgot-password flow on the login screen. |
| `NodeHealthPulse.tsx` | Decorative animated pulse on the login screen. |
| `WeatherStationIllustration.tsx` | Decorative station illustration on the login screen. |

### `components/widgets/` — legacy, mostly removed

Used to be a larger set of generic chart/table widgets from an earlier design
pass. 14 of the original 16 files were confirmed orphaned (never rendered by
any real screen) and deleted. The remaining two are kept only because
`lib/mockStationData.ts` imports their exported **types**, not the components
themselves:

| File | What it is |
|---|---|
| `TemperatureTrendChart.tsx` | Not rendered anywhere — kept for its `TrendPoint` type, which every full-day trend series in `mockStationData.ts` uses. |
| `DailySummaryTable.tsx` | Not rendered anywhere — kept for its `DailySummaryRow` type, used by `mockStationData.ts`'s `dailyRows`. |

### `lib/` — data, contexts, utilities

**Contexts (app-wide state):**

| File | What it is |
|---|---|
| `AuthContext.tsx` | Current user/session, login/logout. |
| `StationContext.tsx` | Station list + currently-selected station (header dropdown). |
| `AdminSettingsContext.tsx` | Draft/published admin settings (basemap theme, tolerances) — see `adminSettings.ts`. |
| `NotificationsContext.tsx` | Header notification bell state. |

**Mock data (the "backend" until a real one exists):**

| File | What it is |
|---|---|
| `mockStations.ts` | The station list. |
| `mockStationData.ts` | Per-station telemetry history — temp/humidity/pressure/rain (minute/hourly/daily) full-day series, daily summary rows. |
| `liveTelemetryData.ts` | Per-station "extras" not in the core series: dew point, wind, forecast, the 60-row ingest log. |
| `mockUsers.ts` | The user roster. |
| `mockReports.ts` | Generated reports + schedules. |
| `mockAuth.ts` / `mockSession.ts` | Login/session simulation, including the dev-login fallback described above. |

**Real (non-mock) utilities:**

| File | What it is |
|---|---|
| `api.ts` | The single `apiFetch()` wrapper + `ApiError` — every real network call in the app goes through this. |
| `websocket.ts` | `DashboardSocket` — real-time client, built but not yet connected (see "Known gaps"). |
| `types.ts` | Every shared TypeScript type/interface (`Station`, `User`, `StationReading`, `ReportSchedule`, ...) — matches the hardware payload and API response shapes exactly. |
| `compareData.ts` | Builds the Compare screen's chart series and analytics matrix rows from station data. |
| `comparisonMetrics.ts` | Generic metric-stats helpers (high/low/avg) used by `compareData.ts`. |
| `reportsDisplay.ts` | Formatting helpers for report schedules (recurrence label, next-run label, format icons/colors). |
| `manualUpload.ts` | CSV column validation for the manual recovery upload flow. |
| `calibration.ts` | Calibration-offset types/defaults. |
| `stationHardware.ts` | Per-station hardware metadata (firmware, sensor suite health, elevation, terrain) — same "realistic mock, not random" pattern as `mockStationData.ts`; read by the Map, Compare, and Admin screens wherever that context is shown. |
| `sensorBand.ts` | Computes the Sensor Triad card's agreement bands. |
| `chartPaths.ts` | SVG path helpers (`scaleSeries`, `smoothLinePath`, `areaPath`) shared by every hand-rolled chart in this app. |
| `adminSettings.ts` | `AdminSettings` type + defaults (basemap theme, polling interval, sensor/rain tolerances). |
| `auditLog.ts` | Local audit-log helper used by the Admin screen. |
| `userSecurity.ts` | Per-user session/security mock state (last activity, session-active flag). |
| `notifications.ts` | Notification list mock data. |
| `geocode.ts` | Reverse-geocoding helper for the map's coordinate inputs. |
| `navigation.ts` / `headerNav.ts` | Screen route/label definitions for the header and mobile nav. |
| `layout.ts` | The single `PAGE_CONTAINER` width/padding class string, shared by the header and page layout so they can't drift apart. |
| `formatTimeAgo.ts` | "3 minutes ago"-style relative time formatting. |
| `useHydrated.ts` | Hook to avoid SSR/client hydration mismatches for anything time-based (clocks, "last updated" labels). |

### `scripts/`

| File | What it is |
|---|---|
| `find-orphaned-files.js` | Static import-graph scan of `app/`/`components/`/`lib/` — reports (and optionally deletes, with `--delete`) any file never reachable from a real Next.js entry point. See its own header comment for how it resolves imports. |