# Dashboard Redesign — Reference Specification & Measurement Log (REFERENCE.md)

> **Document Status:** Complete (Phase 0 Exit Gate Verified)  
> **Evaluation Date:** October 30, 2026  
> **Reference URL:** `https://demo.codeandchill.store/ambrel/`  
> **Testing Agent:** Antigravity Browser Engine Subagent (Chromium headless)  
> **Recording Artifact:** `file:///Users/ideaind/.gemini/antigravity-ide/brain/564ca6c9-f73d-4330-9367-c39f07dd50a8/ambrel_reference_recording_1793349239977.webp`  

---

## 1. Reference Inspection & Visual Capture Evidence

The live reference demo at `https://demo.codeandchill.store/ambrel/` was opened and inspected across multiple viewports and interaction states.

### 1.1 Captured Reference Artifacts
- **Default Light Expanded Dashboard (`1363 x 936 px`):**  
  `file:///Users/ideaind/.gemini/antigravity-ide/brain/564ca6c9-f73d-4330-9367-c39f07dd50a8/ambrel_dashboard_light_1793349274154.png`
- **Collapsed Sidebar Icon Rail (`84px`):**  
  `file:///Users/ideaind/.gemini/antigravity-ide/brain/564ca6c9-f73d-4330-9367-c39f07dd50a8/ambrel_sidebar_collapsed_v2_1793349297770.png`
- **Dark Mode Dashboard:**  
  `file:///Users/ideaind/.gemini/antigravity-ide/brain/564ca6c9-f73d-4330-9367-c39f07dd50a8/ambrel_dashboard_dark_1793349310065.png`
- **Search Modal Overlay (`⌘K` Spotlight):**  
  `file:///Users/ideaind/.gemini/antigravity-ide/brain/564ca6c9-f73d-4330-9367-c39f07dd50a8/ambrel_search_overlay_1793349316676.png`
- **`+ New` Dropdown Menu:**  
  `file:///Users/ideaind/.gemini/antigravity-ide/brain/564ca6c9-f73d-4330-9367-c39f07dd50a8/ambrel_new_menu_1793349326059.png`
- **Mobile Viewport (`390 x 844 px`) Bottom Tab Bar & Drawer:**  
  `file:///Users/ideaind/.gemini/antigravity-ide/brain/564ca6c9-f73d-4330-9367-c39f07dd50a8/ambrel_mobile_view_1793349331410.png`
- **Full Video Session Recording:**  
  `file:///Users/ideaind/.gemini/antigravity-ide/brain/564ca6c9-f73d-4330-9367-c39f07dd50a8/ambrel_reference_recording_1793349239977.webp`

---

## 2. Measured Reference Structure & Design Tokens

### 2.1 Spatial Dimensions & Grid Metrics
| Element | Measured Value / Token | Notes |
| :--- | :--- | :--- |
| **Viewport Tested** | `1363 x 936 px` (Desktop), `390 x 844 px` (Mobile) | DPR `2.0`, Zoom 100% |
| **Expanded Sidebar** | `252px` | Full navigation tree with category headers & badges |
| **Collapsed Sidebar Rail** | `84px` | Centered icon rail with tooltip affordances |
| **Desktop Top Toolbar** | `64px` height | Fixed / sticky top navigation bar |
| **Main Content Padding**| `14px 26px 40px 22px` | Asymmetric top/bottom padding for clean breathing room |
| **Grid Column Gap** | `18px` | Uniform layout gap between widgets and cards |
| **Standard Dashboard Card** | Radius `20px`; Padding `18px 20px 20px` | Soft pill corners with subtle border |
| **KPI Metric Card** | Radius `20px`; Padding `16px 18px 14px`; Height `~128px` | Pastel tinted surface, top label, value, footer trend |
| **KPI Sparkline** | `92px x 30px` (Desktop); `64px` wide (Mobile) | Inline trend line in KPI card corner |
| **Search Pill** | `380px` wide, `42px` high, Radius `13px` | Header quick-search pill with `⌘K` badge |
| **Search Dialog Overlay** | `min(620px, calc(100vw - 24px))` | 60px input header, grouped results, keyboard footer |
| **Primary Action Button (`+ New`)** | Height `40px`, Radius `12px`, Font `13.5px / 600` | Padding `0 16px`, dark solid contrast |
| **Icon Button** | Height `42px`, Radius `13px` | Square icon containers (theme toggle, notifications) |

### 2.2 Typography & Fonts
| Role | Measured CSS Value | Computed Output |
| :--- | :--- | :--- |
| **Font Family** | `Urbanist, system-ui, -apple-system, Segoe UI, sans-serif` | Clean geometric sans-serif |
| **Base Body Text** | `14px`, `font-weight: 500` | High legibility neutral gray |
| **Dashboard Heading (H1)**| `clamp(28px, 2.6vw, 38px)`, `font-weight: 600` | Page title ("Today") with live date subtitle |
| **Card Header Title** | `15px`, `font-weight: 600` | Card header ("Sales by hour", "Best sellers", etc.) |
| **KPI Big Number** | `22px` desktop; `18px` mobile; `font-weight: 600` | High-contrast numerical summary |
| **KPI Sublabel** | `12.5px`, `font-weight: 500` | Metric title ("Net sales", "Average basket") |
| **KPI Footnote / Delta**| `12px`, `font-weight: 500` | Trend indicator ("+12.4% vs yesterday") |

### 2.3 Color Palette (Light & Dark Themes)
- **Light Theme Background:** Soft cool off-white (`#F8F9FA` / `#F4F5F7`).
- **Light Theme Cards:** Pure white (`#FFFFFF`) with 1px border (`rgba(0, 0, 0, 0.06)`).
- **Dark Theme Background:** Deep slate (`#0F1117` / `#13161F`).
- **Dark Theme Cards:** Elevated dark charcoal (`#1A1D27` / `#1E2230`) with border (`rgba(255, 255, 255, 0.08)`).
- **KPI Pastel Tinting (Light Mode):**
  - Card 1 (Sales): Pastel Mint / Sage green accent (`rgba(34, 197, 94, 0.08)` background, `#16A34A` text).
  - Card 2 (Orders): Pastel Ice Blue accent (`rgba(59, 130, 246, 0.08)` background, `#2563EB` text).
  - Card 3 (Average Ticket): Pastel Lavender / Violet accent (`rgba(168, 85, 247, 0.08)` background, `#9333EA` text).
  - Card 4 (Stock / Attention): Pastel Amber / Coral accent (`rgba(245, 158, 11, 0.08)` background, `#D97706` text).

### 2.4 Interaction & Motion Tokens
- **CSS Easing Token:** `cubic-bezier(.22, 1, .36, 1)` (Custom smooth deceleration curve).
- **Sidebar Transition:** `width 250ms cubic-bezier(.22, 1, .36, 1)` with overflow containment.
- **Card Hover Elevation:**
  - Rest: `transform: translateY(0)`, `box-shadow: 0 1px 3px rgba(0,0,0,0.04)`.
  - Hover: `transform: translateY(-2px)`, `box-shadow: 0 8px 20px rgba(0,0,0,0.06)`.
  - Transition duration: `200ms ease`.
- **Search Modal Entrance:**
  - `opacity: 0 -> 1` and `scale(0.97) -> scale(1.0)` with `duration: 180ms ease-out`.

---

## 3. Reference State Inventory

| State | Reference Behavior Observed | Implementation Strategy for POS |
| :--- | :--- | :--- |
| **Light Theme** | Clean off-white background with crisp border separation | Default system theme, maps to existing Tailwind light mode |
| **Dark Theme** | Rich slate dark mode, high contrast typography | Wire through Tailwind `.dark` class + `next-themes` switcher |
| **Sidebar Expanded (252px)** | Full navigation sidebar with grouped menu items | Shell component wrapping dashboard; links to existing POS routes |
| **Sidebar Collapsed (84px)** | Icon rail with tooltips on hover | Persisted toggle state in `localStorage` |
| **Search Modal Overlay** | Triggered by `⌘K` or search bar click; lists items & actions | Global spotlight modal searching menu items, tables & routes |
| **`+ New` Dropdown Menu** | Quick actions: New sale, Product, Member, Cash out | Maps to: New Order (`/orders/new`), Add Dish (`/menu`), Table View (`/admin/tables`) |
| **Mobile Drawer / Bottom Bar** | Bottom fixed bar with 5 icons: Today, Register, Receipts, Stock, More | Rendered on `< 768px` viewports for seamless phone/tablet POS use |

---

## 4. Remaining Unknowns & Implementation Boundaries

1. **JavaScript Spring Physics:**
   - Reference motion uses smooth easing (`cubic-bezier(.22, 1, .36, 1)`); micro-interactions (e.g. magnetic button pull) are JavaScript-driven in Ambrel. For the POS redesign, standard CSS hardware-accelerated transitions will be prioritized to preserve bundle performance.
2. **Data Model Adaptations (Retail → Restaurant):**
   - Ambrel reference labels ("Seattle store", "Register 01", "Hollis lounge chair") are retail-specific.
   - For this project, all metrics remain strictly authentic to the restaurant POS:
     - "Net Sales" → Today's Gross Sales (`₹`)
     - "Sales Count" → Today's Total Orders
     - "Average Basket" → Average Order Value (`todaySales / todayOrders`)
     - "Till Drawer / Register" → Active / Occupied Dining Tables count
3. **Strict Exit Gate Adherence:**
   - No application code has been modified during Phase 0.
