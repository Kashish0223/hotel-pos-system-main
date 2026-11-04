# Ambrel-style restaurant dashboard — phased master prompt for Antigravity

Reference: https://demo.codeandchill.store/ambrel/

Prepared: 30 October 2026. Scope: redesign the existing restaurant POS dashboard and its dashboard navigation shell. Deliverable is implementation instructions; no project code has been changed in this task.

## Read this first

**Aapka desired design ab generic “premium dashboard” description par depend nahi karta.** The live reference was opened, its desktop dashboard inspected, and actual DOM/CSS values measured. Search, theme toggle, sidebar collapse/expand and New menu were inspected. The prompt below locks the measured visual language and tells Antigravity to work one verified phase at a time.

Exact animation durations, spring settings and all hover trajectories were **not** established from this inspection. CSS exposed an easing token but computed static styles mostly showed zero-duration/no active CSS animation. That does not prove no animation: motion may be controlled by JavaScript. Accordingly, the motion timings later in this document are explicitly provisional implementation targets, not invented reference measurements. Antigravity must verify motion with recordings in its own browser before claiming an exact match.

Mobile breakpoint rules were read from the loaded CSS; mobile screenshots/touch behavior were not verified here. The current POS dashboard was reviewed from source; its live rendered baseline has not been captured here.

The newly supplied ZIP has SHA-256 `a32e838bccfbe275e0164e1ada05d2f14517115ec8465a3fa7f212ce6e952a90`, matching the previously reviewed ZIP. Its inner project root is `hotel-pos-system-main/hotel-pos-system-main/`. The source remains the earlier application, not an already repaired version.

## How to use

1. Open the actual project folder in Antigravity. Attach this document and provide the reference URL.
2. Paste the complete **MASTER PROMPT** section below once. It contains the measured design contract and phase instructions.
3. Start with `Execute Phase 0 only.` After reviewing the evidence, use the phase commands at the end. Do not ask it to implement all phases in a single patch.
4. If Antigravity loses context, give it this document plus its generated `docs/dashboard-redesign/STATUS.md` and `REFERENCE.md`, then name the next phase. Do not let it restart or redesign from memory.
5. Exact-reference visual QA and production data QA are separate. Synthetic fixtures may support visual comparison in test environments; they must not become real dashboard metrics.

## Measured reference summary

The reference is a retail dashboard titled **Today**. Translate its information into restaurant language while keeping the visual structure. Preserve the restaurant's actual name/logo, user identity, INR formatting and existing routes. Do not import Ambrel's brand, customers, merchandise, Seattle location, sample receipts or purchase-template banner into the POS.

| Element | Observed / measured value |
|---|---|
| Typeface | Urbanist, system-ui, -apple-system, Segoe UI, sans-serif |
| Base typography | 14px / weight 500 |
| Expanded sidebar | 252px |
| Collapsed rail | 84px |
| Desktop top bar | 64px |
| Main padding | 14px 26px 40px 22px |
| Grid gap | 18px |
| Standard card | 20px radius; padding 18px 20px 20px |
| KPI | 20px radius; padding 16px 18px 14px; about 128px tall at inspected desktop |
| H1 | `clamp(28px, 2.6vw, 38px)`, weight 600 |
| Card title | 15px, weight 600 |
| KPI value | 22px desktop; 18px at mobile breakpoint |
| KPI label | 12.5px |
| KPI footer | 12px |
| Default button | 40px high; radius 12px; 13.5px / 600; horizontal padding 16px |
| Icon button/search | 42px high; radius 13px |
| Search pill | 380px wide at inspected desktop |
| Small button | 32px high, radius 10px, 12.5px text |
| Search dialog | `min(620px, calc(100vw - 24px))`; 60px input header; grouped results and keyboard footer |
| KPI sparkline | 92 × 30px desktop; width 64px on mobile |
| Easing token | `cubic-bezier(.22, 1, .36, 1)` |

Measured browser viewport: 1363 × 936 CSS px; document client width was about 1348px with scrollbar. Main content width was 1048px. At that width, main chart ≈692.66px and side card ≈337.34px, with an 18px gap. These are outputs of the fluid grid, not fixed widths to hard-code at every viewport.

Desktop hierarchy: sidebar → toolbar → Today heading/context/actions → four pastel KPIs → 8/4-column chart and register-summary row → three 4-column cards (best sellers, receipts, staff) → full-width low-stock card. Sticky/sidebar behavior must be confirmed in Phase 0 rather than guessed from a static frame.

---

# MASTER PROMPT

You are implementing a reference-matched dashboard redesign in an existing restaurant POS repository. Act as a senior frontend developer, interaction/animation engineer and software engineer responsible for regression control. Your task is to reproduce the reference dashboard's visual structure and interaction quality while preserving the restaurant's real data semantics and application behavior.

Reference URL: https://demo.codeandchill.store/ambrel/

Read this entire prompt before modifying files. Execute only the phase I name. Start with **Phase 0 only**. A phase is complete only when its own deliverables and verification checks are satisfied. Do not silently move to the next phase or expand into unrelated screens.

## 1. Non-negotiable scope and anti-hallucination contract

- Primary screen: the existing `/` dashboard, backed by `app/page.js`. Add a dashboard-scoped navigation shell and supporting UI components. Other existing routes must remain reachable and visually/functionally unchanged unless a later explicit instruction expands the scope.
- Do not rebuild the project from scratch, migrate databases, change business permissions, replace authentication, change invoice/payment/stock logic, implement Odoo, or rewrite the application router as part of this UI task.
- Preserve the existing restaurant logo at `/images/logo.png`, configured restaurant name, user/session behavior, logout, language/provider behavior and role-aware navigation. Do not replace branding with “Ambrel.”
- Match the reference's geometry, typography, color, density and states. “Inspired by,” “premium,” “modern” or “similar” is not a sufficient completion claim. Compare actual screenshots and list remaining differences.
- Never invent source measurements, animation durations, supported APIs, field names, data, percentages, staff shifts, charts, unread counts, drawer balances, new routes or passing tests.
- Never show sample revenue, random sparklines, random growth percentages or fabricated customer data in the live dashboard. Do not use `Math.random()` or periodically mutate numbers to imitate a demo.
- If the reference is inaccessible, report that specific blocker. You may continue repository analysis using the measured contract below, but do not invent unobserved interactions or claim pixel/motion parity. Request screenshots/recordings or a user-supplied template if needed for unresolved details.
- Do not remove functional features simply because the reference lacks them. Existing module shortcuts move into permission-aware navigation or an organized overflow group.
- Do not copy the reference's commercial banner, store dataset or branding. Rebuild the visual system using project-compatible components. If I supply template source/assets, inspect compatibility before using them; never replace the repository wholesale.
- Do not weaken API checks, add client-side role bypasses, remove ProtectedRoute, suppress lint/type errors, or hide console exceptions to make the demo look complete.
- Existing security/accounting defects are outside this visual change. Log them separately, use synthetic local data for screenshots if necessary, and do not represent the redesigned UI as production-ready accounting.
- If a dashboard metric requires a new backend query, document the gap. Default to an honest empty/unavailable state or a truthful equivalent with the same visual slot. Request a separate narrowly scoped read-only API task instead of silently changing financial semantics.
- Inspect repository instructions and git state; preserve unrelated edits. Keep a small reversible diff per phase. Do not use destructive git resets or production data for visual QA.

## 2. Repository facts you must verify before editing

The supplied snapshot contains:

- `app/page.js`: current homepage dashboard. Auth redirect through `useAuth`; fetches `/api/dashboard/stats` and `/api/settings`; renders its own header/logo/logout, four stats and `<DashboardCards user={user} />`.
- `components/DashboardCards.js`: permission-filtered module shortcuts with emoji icons, colored gradients, glow borders, scale/rotation hover and shimmer. These effects do not match the reference.
- `app/layout.js`: imports `app/globals.css`, applies Poppins, and mounts AuthProvider, LanguageProvider, CartProvider, OrdersProvider, AlertProvider, PushNotificationManager and PWAInstallPrompt. It already wraps page content in `<main>`.
- `components/Header.js`: shared header; do not assume it is the homepage header. Trace imports before modifying it. The homepage currently implements its own navigation.
- `app/globals.css`: active stylesheet, including global font rules and receipt print styles.
- `styles/globals.css`: a second stylesheet exists. Do not edit it assuming it controls the dashboard; verify imports.
- `app/api/dashboard/stats/route.js`: returns `todayOrders`, `todaySales`, `todayRevenue`, `activeOrders`, `totalMenuItems`, `lowStockItems`, `totalCustomers`, `totalStaff`, `pendingExpenses`, `pendingOrders`. It does **not** return the `recentOrders` or `salesChart` arrays that the homepage currently defaults to `[]`.
- `app/api/dashboard/charts/route.js`: returns `dailySales`, `categorySales`, `topMenuItems`, `monthlyRevenue`, `outletPerformance`, `customerTiers`, `inventoryStatus`, `expenseCategories`. Daily sales is a seven-day series; topMenuItems is a last-30-days aggregation, not “today.” Menu joins use `items.menuId`; verify actual order item schema before assuming those arrays contain correct data.
- `lib/auth.js`, `lib/useAuthToken.js`, `lib/rbac.js` and `components/ProtectedRoute.js`: auth/navigation dependencies to preserve, not rewrite for this design task.
- Existing dependencies include Next.js 16, React 19, Tailwind 3, lucide-react and Recharts. Motion/GSAP is not declared in the supplied package.json. Do not assume either is installed. Prefer CSS/native animation for simple effects and at most one deliberately chosen animation library if measured reference behavior needs it.
- Do not treat the obsolete `next lint` script or ignored TypeScript build errors as a passing quality gate. Report baseline/tooling failures separately and use an actual relevant check.

Inspect the actual working tree because it may have changed. If these facts differ, report the current evidence and adapt deliberately.

## 3. Locked visual contract

Use dashboard-scoped tokens such as `--dash-bg`, not global `--bg` overrides that affect existing screens. Prefix classes or use CSS Modules. The new Urbanist font applies to the dashboard shell only initially; preserve Poppins on untouched routes. Ensure the active `body` Arial rule does not override the scoped font. Reserve logo/avatar dimensions and load fonts without a large layout shift.

### Color tokens measured from the reference

| Token meaning | Light | Dark |
|---|---|---|
| Canvas | `#efede7` | `#0f110f` |
| Sidebar | `#f7f5f0` | `#141714` |
| Card | `#fbfaf7` | `#191c19` |
| Secondary surface | `#f4f2ec` | `#151815` |
| Tertiary surface | `#e9e6de` | `#23271f` |
| Main text | `#1c1e1a` | `#ecebe4` |
| Secondary text | `#3b3e37` | `#cfcfc6` |
| Muted text | `#666960` | `#a1a49a` |
| Primary accent | `#ad4b24` | `#e07c4f` |
| Accent hover | `#c25a30` | `#ec8c60` |
| Accent text | `#9c421e` | `#f0a07a` |
| Accent foreground | `#ffffff` | `#1d0f08` |
| Active sidebar pill | `#f1ddd2` | `#3a251b` |
| Active sidebar text | `#8f3c1b` | `#f2a582` |
| Clay KPI | `#f2dccd` | `#3a251b` |
| Sage KPI | `#d8e4d5` | `#1f2e24` |
| Sand KPI | `#ede2c6` | `#312a1b` |
| Sky KPI | `#d6e0eb` | `#1b2633` |
| Positive | `#27744b` | `#6cc495` |
| Negative | `#b02a45` | `#f28499` |
| Warning | `#8f5b0c` | `#e3ac52` |
| Subtle border | `#1c1e1a14` | `#ecebe414` |
| Stronger border | `#1c1e1a26` | `#ecebe429` |

Light card shadow: `0 0 0 1px #1c1e1a14 inset, 0 1px 2px #1c1e1a0a, 0 10px 28px -16px #1c1e1a29`.
Dark base shadow token: `0 1px 2px #0000004d, 0 12px 30px -16px #0009`; combine with its subtle dark-theme border.

Use thin line icons with consistent stroke/size. Match the reference's roughly 17–18px nav/control icons. Use existing lucide-react where shapes fit. Avoid emoji, glossy gradients, neon, purple glows, oversized icon tiles and heavy black drop shadows. Do not bring over the old DashboardCards hover scale of 1.05.

### Geometry and typography

- Expanded sidebar 252px; collapsed 84px; topbar 64px.
- Main padding desktop: top 14px, right 26px, bottom 40px, left 22px.
- Standard gap 18px; 12-column content grid.
- Desktop >1279px: KPI row four equal columns. Main chart spans 8, side summary 4; following three cards span 4 each; low-stock card spans all columns.
- At <=1279px: KPI row two columns; chart full width; other normal cards span 6; final card remains full width.
- At <=999px: main padding 14px 18px 40px; low-stock rows become full width. Verify sidebar treatment against the reference; do not infer an automatic rail merely from this breakpoint.
- At <=760px: content padding `0 14px calc(96px + env(safe-area-inset-bottom))`; normal content cards full width; KPI row stays two columns unless actual reference measurements demonstrate otherwise. Card padding 16px. Drawer width `min(300px, 86vw)`. Five-item mobile bottom navigation has 54px items and safe-area support.
- The mobile rules above were inspected in CSS, not visually certified. Phase 0 must validate actual 390px and 768px rendering. At narrower widths, prioritize no clipping and accessible controls; document any adaptation.
- H1 `clamp(28px, 2.6vw, 38px)`, weight 600; base 14px/500; section titles 15px/600; default buttons 13.5px/600; KPI values 22px desktop, 18px mobile; labels 12.5px; captions 12px.
- Cards radius 20px; smaller controls 10–14px; large overlay radius in the 26px token family after verification. Do not use identical large rounding on every element.
- Standard buttons 40px height, 16px horizontal padding; icon controls 42px; compact controls 32px. Preserve accessible touch hit areas, especially mobile, without inflating the desktop visual rhythm.
- Desktop KPI height observed ~128px. Standard cards padding `18px 20px 20px`; KPI padding `16px 18px 14px`. Reproduce hierarchy with CSS grid, not absolute positioning of the entire screen.
- Search dialog width `min(620px, calc(100vw - 24px))`; input row 60px; grouped results; visible keyboard hints; scroll inside the result list.

## 4. Restaurant information and navigation mapping

Keep the reference's design shell, but use truthful restaurant labels and routes.

| Reference UI | Restaurant UI | Existing destination / rule |
|---|---|---|
| Today | Today / Dashboard | `/` |
| Register / Open register | New order / Open POS | `/orders/new` |
| Receipts | Bills | `/bills` |
| Insights | Reports / Analysis | `/reports`, `/analysis` |
| Catalogue | Menu / Inventory / Categories | `/menu`, `/inventory`, `/categories` |
| Members | Customers | `/customers` |
| Payouts | Finance group | `/settlements`, `/expenses`, `/debtors` only if permitted |
| Staff/security management | Staff | `/staff` using actual permission keys |
| Restaurant operations | Orders, Tables, Kitchen | `/orders`, `/admin/tables`, `/kitchen-display` |
| Support/settings | Settings and existing related links | `/settings`; do not invent `/help` or `/security` pages |

Preserve every currently accessible DashboardCards destination, including feedback QR. Derive a shared nav configuration from verified routes/permission metadata. Groups can be labelled Restaurant, Management, Finance and System, using reference-like uppercase captions and separators. Collapse less-frequent groups so the sidebar stays manageable. Do not infer authorization from a display label. Reuse current permission semantics; do not invent keys such as `view_bills` when the project uses `view_bill`.

Reference sidebar footer contains an operational status block plus user/avatar/menu. Use real restaurant/user information. Do not fake “Till open since...” if no shift/register model supports it. A neutral restaurant/location block is preferable. Use initials where no real avatar exists.

### Dashboard widget mapping and missing-data policy

| Reference slot | Safe default for current project | Required caveat |
|---|---|---|
| Four pastel KPIs | Today's Sales, Today's Orders, Pending Orders, Low Stock | Preserve existing fields; absent ≠ zero; no fabricated deltas/sparklines |
| Sales by hour comparison | Sales overview using verified `dailySales` | Label “Last 7 days” when using that endpoint, never “hourly” |
| Till drawer summary | Service overview with activeOrders/pendingOrders and permitted shortcuts | Do not label as cash balance or drawer count |
| Best sellers today | Popular menu items (last 30 days) when verified | Item lookup/schema may be inconsistent; correct label and missing state |
| Latest receipts | Recent bills or recent orders from verified allowed endpoint | Do not pretend stats API returns these; don't expose unauthorized data |
| On the floor/shift progress | Team summary or restaurant operations card | `totalStaff` means active staff records, not on-shift staff; no fake shift progress |
| Running low | Authorized low-stock items, otherwise count and link | Ingredient quantities/UOM are not assumed to be pieces |

Preserve the dimensions, list density and chart styling of these slots even when content semantics differ. Document this as an intentional restaurant adaptation. For a visually exact fixture comparison, use explicitly labelled test-only fixture data. Do not ship fiction to conceal missing backend capabilities.

Today's Sales currently aggregates non-cancelled order values; it is not proven net settled revenue. Do not rename it “Net sales” or “Cash collected” without a separate validated accounting definition. API counts also use differing filters. If you compute an average, ensure numerator/denominator represent the same set and handle zero/empty distinctly.

Use `Intl.NumberFormat('en-IN', {style:'currency',currency:'INR'})` for actual INR amounts and the restaurant's configured timezone/business date where available. Never copy dollars, static Saturday text, Seattle labels or demo growth percentages. Keep loading, empty, denied, error, stale and zero states distinct.

## 5. Motion contract — inspect first, then match

Observed interactions: animated/dynamic KPI values during load, sidebar collapse to 84px and expand to 252px, a grouped search overlay with keyboard support, light/dark theme switching, and an anchored New-action menu. Sparklines and chart bars exist. Their presence alone is not proof of the exact entrance/hover animation technique.

Measured easing token: `cubic-bezier(.22,1,.36,1)`. Exact durations, hover magnitudes, chart drawing sequences and magnetic behavior remain to be measured. A class name like `magnetic` is a clue, not proof of a specific force/trajectory or library.

Create `MOTION.md` with one row per interaction: trigger, target, initial/final state, duration, delay/stagger, easing, interruption behavior, reduced-motion alternative, evidence and confidence. If unmeasured, label `provisional`, not `reference exact`.

The following are conservative fallback implementation targets ONLY when recordings cannot establish timings; replace them with measured values later:

| Interaction | Provisional implementation | Guardrails |
|---|---|---|
| Initial card reveal | opacity 0→1, y 8→0; 320–420ms; 35–50ms stagger | Trigger once on first ready render; no bouncing; don't replay on polling |
| Sidebar toggle | 252↔84px over 280–360ms | Keep content/sidebar synchronized; avoid text squeezing; test rapid reversal |
| Button feedback | subtle color/shadow 120–160ms; optional press scale 0.98 | Do not add scale/translation unless reference supports it |
| Dialog entrance | opacity plus y 6→0 or scale .985→1, 180–240ms | Trap focus; inert background; restore focus; no slow input delay |
| Menu/popover | fade plus y 4→0, 140–180ms | Anchor correctly; escape/outside-click; interruptible exit |
| Number transition | 450–700ms only after actual data arrives | Stable final value; tabular figures; no invented value; no repeated aria announcements |
| Chart transition | 400–650ms on initial load or deliberate measure change | Don't stack chart-library animation with wrapper animation |
| Theme | subtle 160–220ms color transition if reference supports | No flash/hydration mismatch; no global `transition:all` |

Engineering requirements:

- Start from a visually correct static layout; motion is a separate phase.
- Use CSS for simple colors/opacity/transforms. Introduce at most one compatible animation library if the interaction evidence warrants it, and only after checking the existing dependency tree.
- Do not use React state for every pointer frame. For any verified pointer-follow effect, use refs/animation values and requestAnimationFrame, with complete cleanup. Disable it for touch/coarse pointers.
- Prefer transform/opacity. Sidebar grid/width changes are a deliberate layout exception: profile and implement with restrained layout work or FLIP when needed. Do not indiscriminately animate width/height across all cards.
- No scroll hijacking, continuous decorative motion, WebGL background, heavy blur, oversized overshoot, neon glow, random particle effects or duplicate animation engines.
- All animations must interrupt/reverse cleanly. Rapid sidebar/menu toggles must not accumulate timers or leave content invisible.
- Respect `prefers-reduced-motion`: show final values, disable count-up/translation/stagger and use immediate or restrained fades. All information and actions remain available.
- Never animate payable/receipt totals in a way that lets an intermediate value be mistaken for the true amount. Decorative dashboard count-up is optional; expose the actual value accessibly.
- Do not claim 60fps without profiling. Target stable frames on agreed hardware; record dropped frames/long tasks when measured.

## 6. Recommended component boundaries (proposed, not existing files)

Use names suited to the repository, for example:

- `components/dashboard/DashboardShell.jsx`
- `DashboardSidebar.jsx`, `DashboardTopbar.jsx`, `DashboardMobileNav.jsx`
- `DashboardOverview.jsx`, `DashboardKpiCard.jsx`, `DashboardPanel.jsx`
- `SalesOverviewChart.jsx`, `ServiceOverviewCard.jsx`, `RecentActivityCard.jsx`
- `PopularItemsCard.jsx`, `TeamSummaryCard.jsx`, `LowStockCard.jsx`
- `DashboardSearchDialog.jsx`, `DashboardActionsMenu.jsx`
- `hooks/useDashboardData.js`, `lib/dashboard/navigation.js`, `lib/dashboard/adapters.js`
- `components/dashboard/dashboard.module.css` or an equivalent scoped token/style layer

Do not create empty abstractions for their own sake. Page.js should orchestrate the page, not become a multi-thousand-line file. Keep network/data adapters separate from presentation. Avoid nested `<main>` landmarks because the root layout already has one. Use proper section/headings/landmarks.

Preserve the existing provider tree. Do not introduce a second router or duplicate auth context. Initially mount the shell only around `/`. Do not move every page into a route group merely to draw a sidebar. If a future shared staff shell is requested, plan it separately and handle headers/print/customer routes explicitly.

## 7. Phased execution and exit gates

### Phase 0 — Evidence, baseline and dependency map; no product code changes

Read repository instructions, inspect status, identify active source/style imports and all dashboard dependencies. Run the app with non-production configuration if possible. Record baseline screenshots and console/network failures without fixing unrelated systems.

Open the exact reference. Capture light/dark expanded/collapsed dashboard, search overlay and New menu. Inspect page entrance, button/card hover, sidebar reversal, chart measure change, scrolling and mobile drawer/tabbar where possible. Record animations rather than guessing from the final screenshot. Use comparable viewport, zoom, device-pixel ratio and theme. Separate measured CSS values from visual estimates and proposals.

Create:

- `docs/dashboard-redesign/REFERENCE.md`: measured structure/tokens, viewport and date, state inventory, remaining unknowns.
- `DATA-MAP.md`: existing endpoint/field → widget/label; unavailable fields; permissions and data quality caveats.
- `BASELINE.md`: current dashboard and adjacent route behavior, environment blockers and existing errors.
- `PLAN.md`: file-by-file change plan and verification sequence.
- `STATUS.md`: completed/current/next phase and unresolved issues.

**Exit gate:** no app code modified; route/permission map established; exact reference is accessible or limitations explicitly documented; no fabricated design/motion/data claims. Stop and report.

### Phase 1 — Scoped tokens and static shell

Implement dashboard-only Urbanist, light/dark tokens, sidebar, topbar, breadcrumb, existing logo/user identity and permissions-aware links. Replace homepage header only within the dashboard scope. Use static open/closed states first. Provide real logout and correct route destinations.

Match desktop shell geometry at 1440×900 and 1363×936. Verify font, 252/84 sidebar endpoints, 64px toolbar, content padding, active pill, borders, button sizes and correct logo aspect ratio. No data animation yet. Do not make every sibling page adopt the new theme.

**Exit gate:** shell visually comparable; no duplicate headers/main landmarks; links retain permission semantics; login/logout and unrelated-route style smoke checks pass. Report changed files and screenshots. Stop.

### Phase 2 — Static dashboard composition and true states

Implement KPI row, 12-column chart/summary grid, three supporting cards and low-stock panel. Adapt restaurant labels using the DATA-MAP. Create exact skeleton geometries and real empty/error/no-permission variants. Reuse Recharts where appropriate and match reference bars, gridlines, legends, labels, radii and muted palettes.

Keep live widgets honest. Temporary fixtures may exist only in a dedicated test/story/preview environment clearly labelled synthetic and not imported into the production path. No random sparklines. Missing comparison series remains unavailable, not zeros disguised as history.

**Exit gate:** geometry/typography/spacing closely match at the reference viewport; card order and responsive spans correct; any deliberate content differences documented. No motion masking layout mistakes. Stop.

### Phase 3 — Existing data and behavior wiring

Connect approved existing data sources through adapters. Handle permissions before rendering/fetching sensitive widgets. Use parallel reads where independent; avoid N+1 requests; cancel obsolete requests; prevent stale responses overwriting newer data. Preserve auth headers and session behavior. Do not use errors/401s as a reason to relax backend checks.

Handle data status explicitly (`loading`, `ready`, `empty`, `error`, `denied`, `unavailable`, `stale`). A real zero is visible as zero; unavailable values show a clear placeholder. If the API supplies only seven-day buckets, keep the chart labelled seven days. Never derive all-day totals from the first page of orders. Missing recipe/shift/drawer functionality stays missing.

Implement New actions as verified navigation or existing safe UI flows. Search should start with permission-filtered navigation search; product/order/customer search is added only through existing authorized supported queries. Do not fetch all staff/customer records just to create a visual search demo. Do not ship a fake notification badge; use real alerts if a usable source exists, otherwise omit the count or show an honest empty panel.

**Exit gate:** no fixtures/random values in production; correct loading/error/permission behavior; links/actions/search work; verified labels match actual data scope. No business mutation/API contract changes. Stop.

### Phase 4 — Motion and interaction parity

Implement measured entries from MOTION.md; mark unverified fallback timings as provisional. Tune entrance, count-up if suitable, chart transitions, sidebar, menu, dialog, hover/press and theme transitions independently. Keep text sharp and final coordinates identical to the static phase.

Test keyboard focus, Escape, outside click, rapid repeated actions, async data arrival, tab switch/return, route leave/re-enter and reduced motion. No initial permanently invisible UI if animation fails. No duplicated listeners, rAF loops or Strict Mode side effects.

**Exit gate:** side-by-side recordings demonstrate comparable behavior for the tested interactions; remaining unmeasured differences explicitly listed; no interference with input latency or financial accuracy. Stop.

### Phase 5 — Responsive, dark-mode and accessibility completion

Verify 1440×900, 1363×936, 1280×800, 1024×768, 768×1024 and 390×844. Inspect 1279/1280 and 760/761 breakpoint boundaries. Use the reference at the same sizes; CSS rules alone are not a screenshot comparison.

Test full/rail sidebar, mobile drawer, bottom nav, safe areas, card ordering, chart readability and scroll. No horizontal viewport overflow, clipped labels, hidden controls or bottom-nav overlap. Dark mode must use the measured palette rather than an inverted filter. Theme persistence must not cause hydration errors or affect unrelated pages.

Keyboard-only operation, visible focus, dialog trap/restore, icon labels/tooltips in the rail, appropriate aria-expanded/current, chart accessible summaries and non-color-only statuses are required. Respect zoom; flag the existing root `maximumScale:1` as an accessibility limitation rather than silently ignoring it. A narrowly justified viewport fix may be proposed separately.

**Exit gate:** responsive screenshots and accessibility checks pass for tested states; reference deviations listed; no unnecessary backend changes. Stop.

### Phase 6 — Visual regression, performance and final cleanup

Capture reference and local screenshots at matching viewport/theme/sidebar state. Compare structural geometry and typography with overlays/diffs, masking only truly dynamic values, real restaurant branding/content differences and the reference purchase banner. Do not mask misaligned cards, wrong fonts or large layout differences. Wait for fonts/data/animations to settle before static capture; assess motion separately.

Use targeted meaningful checks: navigation/permissions, menu/dialog keyboard behavior, data loading/failure, theme/reduced-motion, screenshot states and route smoke tests. Run a real build/lint check if environment permits; record exact failures without inventing success. Check the existing order page, bills/print preview, kitchen screen, customer menu and login for unintended global CSS/provider regressions.

Profile sidebar/search/chart interactions in production build if available. Check layout shift, unnecessary rerenders, expensive blur/shadows, listeners/timers, request volume and bundle changes. Report the machine/browser/viewport and method; do not promise device-independent 60fps.

Remove test-only demo dependencies from production imports, dead CSS introduced by the redesign and abandoned components only when references are verified. Keep useful legacy code for other routes intact.

Final deliverables:

1. Implemented dashboard code and focused diff summary.
2. Updated reference, data-map, motion and phase-status documents.
3. Light/dark desktop/mobile screenshots and representative interaction recordings.
4. Actual build/test/performance results with environment limits.
5. Visual mismatch list: resolved / intentional restaurant adaptation / still unresolved.
6. Confirmation that no auth, database schema, financial workflow or Odoo integration was silently changed.

**Final exit gate:** visual claims backed by comparisons, behavioral claims by tests, data by real contracts. If a gate is blocked, report the blocker and remaining work; do not declare exact parity anyway.

## 8. Required response format after every phase

Respond with:

- Phase completed and what visibly/functionally changed.
- Files changed and why each was necessary.
- Reference measurements used versus estimated/provisional values.
- Verification actually performed and artifacts produced.
- Remaining mismatches, defects and environment blockers.
- Next phase and its bounded objective.

Update STATUS.md with this information. Then stop. Do not append a speculative “everything is perfect” claim or proceed automatically into the next phase.

Begin with **Phase 0 only**. If you cannot inspect the reference, finish the repository/data-map work and clearly identify which visual or motion evidence is still needed.

# END MASTER PROMPT

---

## Phase commands to send afterward

**Phase 0:**

> Execute Phase 0 only. Inspect the reference and current repository, capture the baseline, verify the data/permission map and write the redesign plan. Do not modify application code. Distinguish measured design values from unknown animation timings.

**Phase 1:**

> Read the master prompt and STATUS.md. Execute Phase 1 only: scoped typography/tokens and static dashboard shell. Preserve logo, providers, permission semantics and all current routes. Verify light/dark desktop geometry. Stop with evidence and remaining differences.

**Phase 2:**

> Execute Phase 2 only: reference-matched static dashboard composition, chart styling and loading/empty/error states. Follow DATA-MAP.md. No fake business data or extra effects. Match layout before animation. Stop with screenshot comparisons.

**Phase 3:**

> Execute Phase 3 only: connect existing authorized APIs and working navigation/search/actions through adapters. Preserve accurate data meanings. Do not change billing, stock, auth or database logic. Report unavailable fields instead of fabricating them.

**Phase 4:**

> Execute Phase 4 only: reproduce measured reference motion, interaction by interaction. Keep unmeasured timings explicitly provisional. Test interruption, reduced motion and cleanup. Provide recordings; do not claim smoothness based only on a screenshot.

**Phase 5:**

> Execute Phase 5 only: responsive, dark-mode, keyboard, focus and reduced-motion verification at the specified sizes. Compare to the reference. Fix overflow and mismatches without changing unrelated routes.

**Phase 6:**

> Execute Phase 6 only: visual diffs, focused regression checks, production build where available and measured interaction performance. Finish the documentation and report all unresolved differences. Do not claim exact parity or production readiness without evidence.

## If Antigravity starts inventing features or changing the design

Paste:

> Stop expanding scope. Re-read the locked visual contract, DATA-MAP.md and current phase. List each deviation in your changes and its evidence. Remove invented data, unsupported routes, unverified animations and unrelated backend changes from this phase's diff while preserving my unrelated edits. Restore the measured layout and restaurant branding. Re-run the phase checks before continuing. Do not replace missing evidence with assumptions labelled as facts.

## What this deliverable establishes—and what it does not

Established: exact measured color tokens, Urbanist typography, desktop shell/grid dimensions, major responsive CSS rules, real project file/endpoint mapping and a phased implementation/verification process.

Not established: exact JavaScript animation durations/physics, every hover effect, real mobile rendering, live POS screenshot parity, running build or finished redesigned UI. Those are explicit tasks and gates in the prompt, not claims already achieved.
