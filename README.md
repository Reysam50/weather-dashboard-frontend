# Weather Dashboard — Frontend

Next.js dashboard for the Y-NAXII weather monitoring prototype.

**This repo is code only.** All planning, requirements, and architecture
documentation lives in the separate `weather-dashboard-docs` repo — read these before
writing any code, in this order:

1. `01-requirements/dashboard-reference-analysis.md` — the widget set this UI needs
   to reproduce (tables, big-number cards, line/range/pie/bar charts)
2. `01-requirements/functional-requirements.md` — FR-12 (Station Management Map),
   FR-2 (multi-station comparison), FR-8/FR-9 (export/reports UI)
3. `00-project-management/stakeholder-analysis.md` — the 3-role permission model;
   which UI controls are visible to which role
4. `02-architecture/system-architecture.md` §8 — frontend structure decisions
   (Leaflet, ECharts, hybrid rendering)
5. `02-architecture/api-specification.md` — every endpoint this UI calls
6. `05-development/coding-standards.md`, `git-workflow.md`

If code here and the docs repo ever disagree, **the docs repo is the source of
truth** — update the docs first (see `git-workflow.md` §8), then the code.

## Setup

```bash
npm install
cp .env.example .env.local   # fill in real values, never commit
npm run dev
```

## Structure

```
app/
  dashboard/       Main dashboard view (per-station widgets)
  stations/        Station Management Map UI (FR-12)
  login/           Auth
components/
  map/             Leaflet map + station markers (FR-12)
  charts/          ECharts wrappers — line, range/banded, pie, bar
  widgets/         Big-number cards, time-series tables, etc.
lib/
  api.ts           Single REST fetch wrapper — no component calls fetch() directly
  websocket.ts      Single WebSocket connection owner — components subscribe to it
  auth.ts           Auth state / permission-check helpers
```

**Map library:** Leaflet + OpenStreetMap (confirmed, no API key needed).
**Charts:** ECharts — chosen specifically because it natively supports the banded
range chart from the ThingsBoard reference video without heavy customization.
**Rendering:** hybrid (standard Next.js App Router), not a static export.

## Permission-Gated UI

Every role-restricted control (e.g. add/edit/remove on the station map, Technical
Team only) must check permissions **for UX purposes only** — the actual enforcement
is server-side (`system-architecture.md` §5). Never assume a hidden button is a
security boundary.
