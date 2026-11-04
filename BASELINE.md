# Current Dashboard Baseline & Behavior Log (BASELINE.md)

> **Document Classification:** Phase 0 Baseline Inspection & Behavioral Audit  
> **Route Inspected:** `http://localhost:3000/` (Main Administrative POS Terminal)  
> **Inspection Date:** October 30, 2026  
> **Testing Agent:** Antigravity Browser Engine Subagent (Chromium headless)  

---

## 1. Dashboard Visual & Architectural Baseline

### 1.1 Structural Layout
The current dashboard resides at [app/page.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/app/page.js) and operates as a client-side authenticated Single Page component:
- **Authentication Wrapper:** Enforces session validation via `useAuth()`. If unauthenticated or token expires, client triggers `router.push("/login")`.
- **Top Greeting & Quick Action Header:**
  - Displays welcome message: `"Welcome back, Hotel Admin!"` with active role badge (`superadmin`).
  - Subtitle: `"Here's what's happening at your restaurant today."`
  - Action Buttons: `"+ New Order"` (links to `/orders/new`) and `"Table View"` (links to `/admin/tables`) styled with `AccentButton`.
- **Top KPI Summary Cards (4 Columns):**
  1. **Today's Sales:** Green card with trending icon, displaying live gross revenue (`₹3,087.00`).
  2. **Today's Orders:** Blue card displaying order count (`2`).
  3. **Pending Orders:** Yellow card displaying actionable ticket count (`0`).
  4. **Low Stock Items:** Red alert card displaying items under safety threshold (`1` — Amul Butter).
- **Primary Modules Grid ([components/DashboardCards.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/components/DashboardCards.js)):**
  - Responsive 4-column frosted glass grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4`).
  - 13 active operational modules: *Order Management, Menu Management, Inventory, Staff Management, Reports, Settings, Customers, Analysis, Table Management, Kitchen Display, Bills, Categories, Feedback*.

```
+----------------------------------------------------------------------------------------------------+
|  Top Header: Welcome back, Hotel Admin [Role: superadmin]               [+ New Order] [Table View] |
+----------------------------------------------------------------------------------------------------+
|  [ Today's Sales: ₹3,087 ]  [ Today's Orders: 2 ]  [ Pending Orders: 0 ]  [ Low Stock: 1 ]         |
+----------------------------------------------------------------------------------------------------+
|  Module Cards (4x4 Grid):                                                                          |
|  [ 🧾 Order Management ]  [ 📋 Menu Management ]  [ 📦 Inventory ]         [ 👥 Staff Management ]   |
|  [ 📊 Reports ]           [ ⚙️ Settings ]          [ 🧑 Customers ]         [ 📈 Analysis ]          |
|  [ 🍽️ Table Management ]  [ 🍳 Kitchen Display ]  [ 💰 Bills ]             [ 🗂️ Categories ]        |
|  [ 💬 Feedback QR ]                                                                                |
+----------------------------------------------------------------------------------------------------+
```

---

## 2. Interaction & Animation Measurements

All transitions and interactions were observed live in the browser session and recorded in artifact `dashboard_baseline_1793348973362.webp`:

| Interaction Trigger | Target Element | Measured CSS Transition / Behavior | Quality Assessment |
| :--- | :--- | :--- | :--- |
| **Page Entrance** | Root Container | Instantaneous render with spinner fallback (`animate-spin border-blue-600`) | Smooth, sub-300ms compile time via Turbopack |
| **Card Hover** | `DashboardCards.js` | `transform -translate-y-1 scale-105 shadow-lg shadow-black/40` (`200ms ease-out`) | Tactile 3D elevation feeling |
| **Shimmer Sweep** | Card Background | `translateX-0` from `-translateX-full` (`1000ms ease-out`) | Subtle light reflection across frosted glass |
| **Border Glow** | Card Border | 2px gradient mask opacity changes from `0.1` to `1.0` | High-end visual highlight |
| **Button Hover** | `AccentButton.jsx` | `hover:from-orange-600 hover:to-orange-600 shadow-md hover:shadow-lg` | Clear interactive affordance |
| **Button Click / Tap**| `AccentButton.jsx` | `active:scale-95 transition-transform` | Tactile feedback on touch and mouse press |
| **Scroll Behavior** | Page Window | Native scroll with custom slim bronze scrollbar (`.custom-scrollbar`) | Smooth scrolling without jank |
| **Mobile Drawer / Stack** | Viewport `< 768px`| Grid switches to single-column vertical stack (`grid-cols-1`) | Fully readable; buttons stack on mobile |

---

## 3. Adjacent Route Connectivity

| Adjacent Route | Purpose | Connectivity Status from Dashboard |
| :--- | :--- | :--- |
| `/orders/new` | POS Table Order Entry & KOT | Directly accessible via top header `+ New Order` button |
| `/admin/tables` | Visual Floor Plan & QR Codes | Directly accessible via top header `Table View` button |
| `/orders` | Order stream & fulfillment | Accessible via card `Order Management` |
| `/menu` | Dish master & categories | Accessible via card `Menu Management` |
| `/inventory` | Raw material depletion & stock | Accessible via card `Inventory` |
| `/kitchen-display` | Live Kitchen Queue (KDS) | Accessible via card `Kitchen Display` |
| `/bills` | Thermal invoice & settlement | Accessible via card `Bills` |
| `/reports` | Revenue graphs & performance | Accessible via card `Reports` |
| `/settings` | Restaurant & system preferences | Accessible via card `Settings` |
| `/login` | Authentication gateway | Redirects to `/login` upon clicking `Logout` |

---

## 4. Console Logs, Network Traffic & Existing Errors

During live browser testing and API monitoring:
- **Network Requests Observed:**
  - `POST /api/auth/superadmin` → `200 OK` (352ms)
  - `GET /api/dashboard/stats` → `200 OK` (Returns live stats: `{ todayOrders: 2, todaySales: 3087, ... }`)
  - `GET /api/settings` → `200 OK` (Returns `{ general: { restaurantName: "Hotel-POS Luxury & Restaurant", ... } }`)
- **Console Log Evaluation:**
  - Zero fatal JavaScript runtime errors.
  - PWA install prompt handler initialized cleanly.
  - Service worker registered without conflict.
- **Environment Blockers:**
  - No active blockers: Embedded MongoDB is running on port `27017` storing data in persistent directory `.mongo_data`.
  - Next.js development server is running stably in Turbopack mode on port `3000`.
- **Codebase Integrity (Phase 0 Exit Gate):**
  - **Zero product application code files were modified during Phase 0.**
