# Weather Dashboard — Frontend

Next.js dashboard for the Y-NAXII weather monitoring station network. Five
screens (Live Dashboard, Compare, Reports, Station Map, Admin) reading from a
real API (REST + WebSocket) — point `NEXT_PUBLIC_API_BASE_URL` / `NEXT_PUBLIC_WS_URL` at
the backend and every screen reads from it. See **Backend integration** below.

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
| `NEXT_PUBLIC_WS_URL` | WebSocket URL for live telemetry (`lib/websocket.ts`). |
| `NEXT_PUBLIC_DEV_LOGIN_EMAIL` / `NEXT_PUBLIC_DEV_LOGIN_PASSWORD` | Dev-only login, used automatically **only** when `POST /auth/login`/`GET /auth/me` fail with a network error (no backend reachable at all) rather than a real HTTP response — see `lib/mockSession.ts`. Once a real backend exists these are never consulted. |

## Backend integration model

Every screen reads from the API — there is no mock data layer. All requests
go through `lib/api.ts`'s `apiFetch()` (which also unwraps the API's standard
`{"error": {"code", "message"}}` shape into `ApiError`), and every response is
converted from snake_case to the app's camelCase types in one place,
`lib/apiMappers.ts`.

| Screen | Reads | Writes |
|---|---|---|
| Live Dashboard | `useLiveTelemetry` — `GET /telemetry/{id}/latest` + `?resolution=minute\|hour\|day`, then live readings over the WebSocket | — |
| Compare | `useCompareData` — `GET /stations/compare?ids=&resolution=hour\|day` | — |
| Reports | `useReports` — `GET /reports/schedules`, `GET /reports/generated` | `POST`/`DELETE /reports/schedules`, `POST /telemetry/{id}/upload` (manual recovery) |
| Station Map | `StationContext` — `GET /stations`; inspect pod via `useStationSnapshot` | `POST /stations`, `PATCH /stations/{id}` |
| Admin | `GET /users` | `POST`/`PATCH`/`DELETE /users/{id}` |

**Failure behaviour:** a failed write shows an error and changes nothing on
screen — the UI never claims something was saved that the server didn't
confirm. A failed read shows a per-screen error state with a Retry button.

**Live data:** `lib/websocket.ts` owns the single WebSocket. On every
(re)connect it first triggers a REST re-fetch (so a reconnect never resumes
from a stale value), then re-subscribes; reconnects use exponential backoff.
The dashboard shows a banner while the socket is down.

**Offline cards:** every telemetry field on `StationReading` is nullable. A
`null` means that sensor sent nothing, and the card that depends on it
replaces its body with an offline notice (`components/layout/OfflineCardBody.tsx`)
— independent of whether the station itself is online. A station that has
never reported at all gets a page-level "no data" state instead.

**Dev login (the one remaining fallback):** `lib/mockAuth.ts` /
`lib/mockSession.ts` only kick in when `POST /auth/login` or `GET /auth/me`
fail with a *network* error (no backend reachable), using
`NEXT_PUBLIC_DEV_LOGIN_*`. Real HTTP responses (success or error) always win.

## Known gaps

- **Wind speed/direction** are wired end-to-end (dashboard, compare, export)
  and confirmed by the hardware team, but the sensor isn't in the payload yet —
  until it is, every wind card correctly shows its offline state. No gust field
  exists in the payload, so gust always reads "—".
- **No backing endpoint yet for:** station calibration offsets
  (`components/map/CalibrationDrawer.tsx`, local to the session), per-user
  2FA/last-activity/session-revoke (removed from the Admin roster rather than
  faked), and an audit log (the Audit tab lists only this session's actions).
  Admin settings persist to `localStorage`, not a `/settings` endpoint.
- **Still placeholder data:** `lib/stationHardware.ts` (per-station firmware,
  sensor suite, elevation, gateway — used by Compare/Map) and the 7-day
  forecast strip (`buildPlaceholderForecast` in `lib/liveTelemetryData.ts`).
  Neither has an API behind it.
- `GET /users` has no display name, so `mapUser` derives one from the email.
- **Declared but unused dependencies:** `apexcharts` / `react-apexcharts` and
  `@dnd-kit/*` are in `package.json`, but no rendered screen uses them — every
  chart is hand-rolled SVG (`lib/chartPaths.ts`). Safe to remove.
- Run `node scripts/find-orphaned-files.js` any time to re-check for unused files.

## Structure

```
app/(protected)/    Every real screen — dashboard, compare, reports, stations, admin
app/login/          Auth
components/         One folder per screen, plus layout/ (shared chrome) and widgets/ (legacy, mostly unused — see below)
lib/                API layer (hooks, mappers, websocket), contexts, and small utilities
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
| `OfflineCardBody.tsx` | The shared "no data / sensor offline" state every dashboard card shows when its reading is `null`. |
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
| `WeatherStationIllustration.tsx` | Decorative station illustration on the login screen. |

### `components/widgets/` — legacy, mostly removed

Used to be a larger set of generic chart/table widgets from an earlier design
pass. 14 of the original 16 files were confirmed orphaned (never rendered by
any real screen) and deleted. The remaining two are kept only because
`lib/deriveStationView.ts` imports their exported **types**, not the components
themselves:

| File | What it is |
|---|---|
| `TemperatureTrendChart.tsx` | Not rendered anywhere — kept for its `TrendPoint` type, which every full-day trend series in `deriveStationView.ts` uses. |
| `DailySummaryTable.tsx` | Not rendered anywhere — kept for its `DailySummaryRow` type, used by `deriveStationView.ts`'s `dailyRows`. |

### `lib/` — data, contexts, utilities

**Contexts (app-wide state):**

| File | What it is |
|---|---|
| `AuthContext.tsx` | Current user/session, login/logout. |
| `StationContext.tsx` | Station list + currently-selected station (header dropdown). |
| `AdminSettingsContext.tsx` | Draft/published admin settings (basemap theme, tolerances) — see `adminSettings.ts`. |
| `NotificationsContext.tsx` | Header notification bell state. |

**Data layer (hooks that talk to the API):**

| File | What it is |
|---|---|
| `useLiveTelemetry.ts` | Live Dashboard's data source: REST (latest + minute/hour/day) plus WebSocket live updates, with resync-on-reconnect. |
| `deriveStationView.ts` | Turns raw readings into the shapes each dashboard card expects (`StationView`, `LiveTelemetryExtras`) — no invented values; gaps stay `null`. |
| `useCompareData.ts` | Compare screen's `GET /stations/compare` fetch. |
| `useReports.ts` | Reports schedules/generated reports, plus create/delete schedule. |
| `useStationSnapshot.ts` | Latest reading + 12h sparkline data for the map's inspect pod. |
| `apiMappers.ts` | snake_case API responses → camelCase app types (`mapStation`, `mapReading`, `mapUser`, ...). |
| `mockAuth.ts` / `mockSession.ts` | Dev-login fallback only (see "Backend integration model"). |

**Utilities:**

| File | What it is |
|---|---|
| `api.ts` | The single `apiFetch()` wrapper + `ApiError` — every real network call in the app goes through this. |
| `websocket.ts` | `DashboardSocket` — the single WebSocket: backoff reconnect, resync-then-resubscribe. |
| `types.ts` | Every shared TypeScript type/interface (`Station`, `User`, `StationReading`, `ReportSchedule`, ...) — matches the hardware payload and API response shapes exactly. |
| `compareData.ts` | Builds the Compare screen's chart series and analytics matrix rows from station data. |
| `comparisonMetrics.ts` | Generic metric-stats helpers (high/low/avg) used by `compareData.ts`. |
| `reportsDisplay.ts` | Formatting helpers for report schedules (recurrence label, next-run label, format icons/colors). |
| `manualUpload.ts` | CSV column validation for the manual recovery upload flow. |
| `calibration.ts` | Calibration-offset types/defaults. |
| `stationHardware.ts` | Placeholder per-station hardware metadata (not from the API — see "Known gaps"). |
| `chartPaths.ts` | SVG path helpers (`scaleSeries`, `smoothLinePath`, `areaPath`) shared by every hand-rolled chart in this app. |
| `adminSettings.ts` | `AdminSettings` type + defaults (basemap theme, polling interval, sensor/rain tolerances). |
| `auditLog.ts` | Local audit-log helper used by the Admin screen. |
| `notifications.ts` | Notification list data for the header bell (local; no notifications endpoint yet). |
| `geocode.ts` | Reverse-geocoding helper for the map's coordinate inputs. |
| `navigation.ts` / `headerNav.ts` | Screen route/label definitions for the header and mobile nav. |
| `layout.ts` | The single `PAGE_CONTAINER` width/padding class string, shared by the header and page layout so they can't drift apart. |
| `formatTimeAgo.ts` | "3 minutes ago"-style relative time formatting. |
| `useHydrated.ts` | Hook to avoid SSR/client hydration mismatches for anything time-based (clocks, "last updated" labels). |

### `scripts/`

| File | What it is |
|---|---|
| `find-orphaned-files.js` | Static import-graph scan of `app/`/`components/`/`lib/` — reports (and optionally deletes, with `--delete`) any file never reachable from a real Next.js entry point. See its own header comment for how it resolves imports. |