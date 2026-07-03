# OTLP Log Viewer

Senior Product Engineer take-home (Dash0). Time-boxed at ~4h: bias to shipping a
polished vertical slice over gold-plating. Always work in **English** — code,
comments, commits, docs, and replies.

## Repository layout

| Path | Role |
|---|---|
| repo root | The deliverable — the Next.js app lives directly at the root, submitted as a public GitHub repo + README. Bonus: Vercel deployment. |
| `otlp-logs-api/` | Assignment's reference API implementation. **Read-only, local reference — gitignored and excluded in `tsconfig.json`, never committed or pushed.** |
| `README.md` (root) | Currently the assignment brief; replaced by the project README before submission. |
| `CLAUDE.md` (root, this file) | Single source of truth for how we work. No other CLAUDE/AGENTS files may exist in the tree. |

## Product scope

Three required features, judged on data fetching/state patterns, OTLP
transformation, component architecture, TypeScript, observability-domain UX,
visual polish, and production-ready organization:

1. **Log list** — table (Severity, Time, Body), expandable rows showing all attributes
2. **Histogram** — log count over time (X: time, Y: count), pure D3
3. **Group by service** — toggle between flat list and collapsible per-resource groups

Part 2 of the assignment (filtering/sharing design discussion) is interview-only.
Do not code it.

## Data source

```
GET https://take-home-assignment-otlp-logs-api.vercel.app/api/v2/logs
```

Returns `IExportLogsServiceRequest` (`resourceLogs[] → resource.attributes[] +
scopeLogs[] → logRecords[]`). **Random mock data on every request** — fetch
exactly once per page load; never refetch on client interaction or the view
shifts under the user.

Verified gotchas (against the live API — treat as invariants):

- `timeUnixNano` is a **nanosecond string** (e.g. `"1782925580937000000"`) that
  overflows `Number.MAX_SAFE_INTEGER`. Parse via `BigInt` (or string slicing)
  before converting to ms. `Number(timeUnixNano)` is always a bug.
- Attribute values are the OTLP `AnyValue` union (`{ stringValue? | intValue? |
  boolValue? | … }`, exactly one member set). One `unwrapAnyValue()` helper,
  used everywhere.
- `severityNumber` 0–24 → bands: 1–4 TRACE, 5–8 DEBUG, 9–12 INFO, 13–16 WARN,
  17–20 ERROR, 21–24 FATAL, 0 UNSPECIFIED. The mock API's `severityText` can
  disagree with the number — **`severityNumber` is the source of truth.**
- Bodies may be multi-line stack traces, JSON strings, or long prose — classify
  (`bodyKind`) and render each appropriately (pretty-print JSON, preformat traces).
- Service identity = `resource.attributes` keys `service.namespace` /
  `service.name` / `service.version`. Data spans the trailing 24h; 8–20
  resources × 5–50 records (~100–1000 rows total).

## Stack — locked decisions, do not relitigate

| Decision | Rationale |
|---|---|
| Next.js 16 App Router, TS strict, Turbopack | Assignment stack. Next 16 differs from training data — read `node_modules/next/dist/docs/` before framework-touching code. |
| Server-side computation | Fetch + transform OTLP in Server Components; clients receive flat, render-ready view models. Raw OTLP never crosses the client boundary. |
| Zustand (no Redux) | UI state only (display mode, expansion, future time-range selection). Server data flows down as props. |
| TanStack Table v8 | Headless (we own markup to match Penpot), built-in expanding/grouping. Add `@tanstack/react-virtual` only if row count demands it; never AG Grid/MUI. |
| Pure D3, math-only | `d3-scale`, `d3-array`, `d3-time-format` compute; React renders the SVG. Never let D3 own DOM (`.select().append()` is banned). |
| CSS Modules | Chosen after evaluating Tailwind, styled-components, styled-jsx: zero runtime, RSC-compatible, the Next.js docs' recommended standard for custom scoped CSS. |
| Drizzle only if a DB appears | No persistence in scope. Do not add a database speculatively. |
| `connection()` + `<Suspense>` | The route must render dynamically (random data per request) while streaming a loading fallback. |
| TanStack Query v5 | RSC `prefetchQuery` → `dehydrate` → `HydrationBoundary`; client reads the hydrated cache via `useLogsDashboard()`. No implicit refetching (`staleTime: Infinity`, focus refetch off — the mock API is random per request). `refetch()` gives on-demand refresh; `POLL_INTERVAL_MS` in the hook flips on polling. `/api/logs` route handler reuses `getLogsDashboardData()` for client refetches. |

## Architecture

Feature-based structure: `components/` is generic and domain-agnostic;
everything log/OTLP-specific lives in `features/dashboard-logs/`. Routing is
App Router file conventions — folders under `app/` are the routes.

```
src/
  app/                        # routes: layout.tsx, page.tsx (RSC prefetch),
    providers.tsx             # QueryClientProvider (client)
    api/logs/route.ts         # GET → getLogsDashboardData() for client refetch/polling
  components/                 # reusable, zero domain knowledge
    nav-bar/  logo/  data-table/  charts/bar-chart/  stat-card/
  features/
    dashboard-logs/
      api/                    # the feature's data layer (bulletproof-react style):
                              # types.ts (wire), view-model.ts (render-ready),
                              # fetch-logs.ts, transform.ts (Luca's algorithm),
                              # dashboard-data.ts (single server-side assembly point)
      components/             # logs-dashboard (query consumer + grid), log-table,
                              # log-table-card, log-columns, log-details,
                              # severity-badge, grouped-log-list, display-mode-toggle,
                              # logs-distribution-card
      hooks/                  # use-logs-dashboard.ts (TanStack Query hook)
      stores/                 # index.ts — display-mode store (zustand)
  lib/                        # truly app-wide pure helpers only
    format.ts                 # d3-time-format helpers
    query-client.ts           # per-request (server) / singleton (browser) QueryClient
```

Dependency rule: `features/*` may import `components/` and `lib/`;
`components/` and `lib/` must never import from `features/`. New generic
component → `components/`. New domain behavior → the feature.

### Component folder convention — SETTLED, do not relitigate

One kebab-case folder per component; implementation named after the folder;
**no index files in component folders** (no barrels, no `index.ts(x)`):

```
data-table/
  data-table.tsx       # the component
  style.module.css     # its styles
  <helper>.tsx/.css    # private extras (e.g. log-columns.tsx + log-columns.module.css)
```

Imports name the file directly: `@/components/data-table/data-table`,
`../severity-badge/severity-badge`. The repeated segment is intentional — it is
the only resolution that works folder-per-component without index files, and
the trade-off is accepted. Sole exception: `stores/index.ts` holds the store
implementation directly. Named exports only — default exports are banned outside
App Router files that require them (`page.tsx`, `layout.tsx`, `error.tsx`).
Aggregate barrels (`components/index.ts` re-exporting many modules) are banned;
they defeat tree shaking.

## Design system — extracted from Penpot (source of truth)

Layout (1280×832 reference): sticky top nav (logo + Dashboard/Settings), 1px
divider, "Overview" heading, two-column grid:

- **Left** — "All logs" card, the only light surface (sage), radius 8, 1px
  border, stretches to full page height. Controls row: group-by-service toggle
  (left), "expand →" (right). Table: Severity | Time | Body, thin dark dividers.
- **Right top** — "Logs distribution **24h**" panel (transparent, 1px border,
  radius 8). Bars: 4px wide, pill-radius, 24px pitch. `from / to` caption
  bottom-right.
- **Right bottom** — stat card: count 72px/700 + caption 24px (total rows at
  snapshot time).

Typography: **IBM Plex Mono** everywhere except nav links (**IBM Plex Sans**
400 16px). Loaded via `next/font`. Sizes: heading 32, panel titles 24, body 16,
table 14, stat 72/700.

Color: **oklch only** — hex/rgb/hsl never appear in code except as trailing
`/* #… */` comments documenting Penpot origin. Tokens live as CSS custom
properties in `globals.css`; components reference `var(--color-…)` and never
hardcode values.

Tokens are a green lightness ramp (50 light → 950 dark) plus true neutrals:

```css
--color-white:     oklch(1 0 0);                /* #ffffff nav + panel titles */
--color-green-50:  oklch(0.9738 0.0163 133.82); /* #f2f9ee text on dark */
--color-green-100: oklch(0.9039 0.0211 140.90); /* #d8e3d6 light sage card */
--color-green-400: oklch(0.8063 0.2013 138.73); /* #75dd52 brand green */
--color-green-900: oklch(0.2057 0.0066 134.99); /* #161815 text on card */
--color-green-950: oklch(0.1957 0.0075 145.28); /* #131613 page background */
--color-gray-300:  oklch(0.8853 0 0);           /* #d9d9d9 histogram bars */
--color-gray-700:  oklch(0.3806 0.0031 164.93); /* #414342 borders/dividers */
```

- Brand green (`--color-green-400`) = interactive/highlight states only (toggle
  on, hover, focus). The base design is deliberately near-monochrome.
- Severity ramp: consistent oklch lightness/chroma per role (FATAL/ERROR red
  family, WARN amber, INFO accent-green family, DEBUG/TRACE muted). Severity is
  always **color + text**, never color alone.
- Dark-first: `color-scheme: dark` on `:root`; viewport `colorScheme` metadata set.

## Code standards

- **Dumb components.** Components render props. No fetching, no transformation,
  no business logic in components — that lives in `lib/` (pure `(input) =>
  output`, testable without React). A `useEffect` that reshapes data is a smell:
  move the reshaping to `lib/`.
- **Naming.** Descriptive, no one-character identifiers — including D3
  callbacks and `.map()` (`bucket`, `logRecord`, `datum`; never `d`, `b`, `x`).
- **Comments.** Rare; only non-obvious constraints (e.g. the BigInt overflow).
  Never narrate the code, never leave section-banner comments.
- **TypeScript.** `strict: true`. Banned: `any`, non-null assertion `!`, and
  `as` except where a boundary makes it unavoidable (prefer typed declarations
  at JSON boundaries). Model OTLP unions precisely.
- **Files.** Small, single-purpose. Prefer composition over configuration flags.
- **Docs before APIs.** Never use a library API from memory — check current
  docs first (TanStack, D3, Zustand shift between majors; Next 16 docs are
  bundled in `node_modules/next/dist/docs/`). Run the `modern-web-guidance`
  skill before implementing any new UI pattern.

## Resilience & accessibility (required, not optional)

- The remote API can fail: `app/error.tsx` must exist with a styled retry UI.
  `fetch-logs.ts` throws typed, descriptive errors.
- Every interactive element is keyboard-operable with visible focus:
  expandable table rows need `tabIndex`, Enter/Space handling, and
  `aria-expanded`; the toggle keeps `role="switch"` + `aria-checked`.
- Formatted timestamps must be timezone-stable between server render and client
  hydration (format once server-side into the view model, or render in a
  hydration-safe way). Hydration warnings in the console are release blockers.
- Empty, loading, and error states are designed states — never a blank panel.

## Testing

Pure functions are the test surface — `transform.ts` (flattening,
bucketing, grouping, severity mapping, `unwrapAnyValue`) is the priority target
once implemented. Colocate as `<name>.test.ts` next to the source. Components
are kept dumb precisely so they don't need heavy test scaffolding; do not add
E2E infra for this scope.

## Verification workflow

Never claim UI work done without looking at it:

1. `chrome-devtools` skill/MCP: drive the running app, screenshot against the
   Penpot design, check `list_console_messages` (errors AND hydration warnings),
   inspect network, `lighthouse_audit` before submission.
2. `chrome-devtools-mcp:a11y-debugging`: semantics, ARIA, focus order, keyboard
   nav, contrast — before a feature is called finished.
3. `chrome-devtools-mcp:debug-optimize-lcp` / `loading-sequence`: Core Web
   Vitals pass before submission.

## Quality gate & git

Before every commit, all three must pass clean:

```bash
npm run lint && npx tsc --noEmit && npm run build
```

- Conventional commits (`feat:`, `fix:`, `refactor:`, `chore:`), imperative,
  scoped small. No WIP commits on main.
- The submitted repo must be self-explanatory: README with setup, architecture
  overview, decisions and trade-offs, and what you'd do with more time.

## Definition of done (per feature)

Quality gate green · verified visually against Penpot · console free of errors
and hydration warnings · keyboard operable · empty/error states handled ·
matches the design tokens (no hardcoded colors/sizes).

## Working agreements

- **The data formatting algorithm is Luca's.** `features/dashboard-logs/api/transform.ts`
  (`unwrapAnyValue`, `flattenLogs`, `buildHistogram`, `groupByService`) is being
  implemented by Luca by hand — work in progress, may transiently fail
  `tsc`. Never modify it without explicit ask; report its type errors, don't fix
  them. The UI is wired to the signatures; everything lights up when they land.
- Structure and styling decisions marked SETTLED above are closed. If a change
  is truly needed, name the concrete cost of the status quo first.
