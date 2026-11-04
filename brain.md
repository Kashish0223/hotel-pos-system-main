# Hotel POS Management System — System Brain & Architecture Blueprint (brain.md)

> **Document Classification:** Master Architecture, Feature Specification & Design System Reference  
> **Target System:** Hotel-POS Point of Sale (POS) & ERP Enterprise Platform  
> **Tech Stack:** Next.js 16 (App Router), React 19, TailwindCSS v3.4, MongoDB, AWS S3, Node.js, Web Push, SSE, PWA  

---

## 1. System Overview & Philosophy

The **Hotel POS Management System** is an enterprise-grade hospitality operating platform engineered for luxury hotels, multi-outlet restaurant chains, and fine-dining establishments. It orchestrates front-of-house guest interactions (contactless QR self-ordering, table booking, loyalty, bill generation) seamlessly with back-of-house operations (kitchen display system, inventory tracking, recipe depletion, staff scheduling, multi-outlet analytics, and supplier procurement).

```mermaid
graph TD
    subgraph FrontOfHouse [Front of House & Guest Facing]
        QR[Table QR Code] --> DigitalMenu[Digital QR Menu /customer/menu]
        DigitalMenu --> OTP[Email OTP Verification]
        OTP --> GuestOrder[Guest Placed Order]
        WaitStaff[Waiter / Receptionist POS] --> POSOrder[POS Order Entry /orders]
    end

    subgraph CoreEngine [Real-Time Processing & State Engine]
        GuestOrder --> APIOrder[/api/orders]
        POSOrder --> APIOrder
        APIOrder --> TableSync[Table Status Auto-Lock: Booked]
        APIOrder --> SSE[Server-Sent Events /api/events]
        APIOrder --> Push[Web Push Notifications]
    end

    subgraph BackOfHouse [Back of House Operations]
        SSE --> KDS[Kitchen Display System /kitchen-display]
        KDS --> SoundAlert[Audio Alert & Ticket Queue]
        KDS --> PrepStatus[Prep Status: Ready/Served]
        PrepStatus --> TableSync2[Table Status Auto-Release: Available]
    end

    subgraph FinanceInventory [Finance, Inventory & Back-Office]
        APIOrder --> Billing[Bill & Invoice Engine /bills]
        Billing --> ThermalPrint[80mm Thermal KOT / A4 Invoice]
        Billing --> Settlement[Daily Settlement & Debtors Ledger]
        APIOrder --> StockDepletion[Inventory Depletion /inventory]
        StockDepletion --> SupplierPO[Supplier Purchasing /purchases]
    end
```

---

## 2. Design System & Theming Architecture

The system uses a bespoke luxury hospitality design language combining frosted glassmorphism, warm amber/gold culinary accents, high-contrast dark/light mode tokens, and micro-interactions optimized for touchscreens and desktop terminals.

### 2.1 Color Palette & Theme Tokens

The application defines its semantic color scheme using TailwindCSS with root CSS variable bindings in [styles/globals.css](file:///Users/ideaind/Desktop/hotel-pos-system-main/styles/globals.css) and [tailwind.config.ts](file:///Users/ideaind/Desktop/hotel-pos-system-main/tailwind.config.ts).

#### Primary Brand & Accent Colors
| Role | HEX / Value | Tailwind Class | Application |
| :--- | :--- | :--- | :--- |
| **Culinary Amber / Bronze** | `#d69551` / `#c96d33` | `from-amber-400 to-yellow-600` | Primary buttons, active tabs, scrollbar thumbs, key highlights |
| **Vibrant Orange** | `#ea580c` / `#f97316` | `bg-orange-500`, `text-orange-600` | POS action buttons, status alerts, active indicators |
| **Emerald Green** | `#10b981` / `#059669` | `from-emerald-400 to-green-600` | Success badges, paid bills, available tables, menu management |
| **Indigo / Royal Purple**| `#6366f1` / `#8b5cf6` | `from-purple-400 to-violet-600` | Staff management, analytics cards, glowing border gradients |
| **Crimson Red** | `#ef4444` / `#dc2626` | `from-rose-400 to-red-600` | Destructive actions, low stock alerts, occupied tables, KOT cancel |
| **Cyan / Ocean Blue** | `#06b6d4` / `#3b82f6` | `from-cyan-400 to-blue-600` | Inventory operations, category management, reports |

#### CSS Variables Matrix (Light vs. Dark Mode)
```css
/* Light Mode Root */
:root {
  --background: 0 0% 100%;             /* Pure White #ffffff */
  --foreground: 0 0% 3.9%;             /* Near Black #0a0a0a */
  --card: 0 0% 100%;
  --card-foreground: 0 0% 3.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 3.9%;
  --primary: 0 0% 9%;                  /* Deep Slate */
  --primary-foreground: 0 0% 98%;
  --secondary: 0 0% 96.1%;
  --secondary-foreground: 0 0% 9%;
  --muted: 0 0% 96.1%;
  --muted-foreground: 0 0% 45.1%;
  --accent: 0 0% 96.1%;
  --accent-foreground: 0 0% 9%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 89.8%;
  --input: 0 0% 89.8%;
  --ring: 0 0% 3.9%;
  --radius: 0.5rem;                    /* 8px base border radius */
}

/* Dark Mode Tokens */
.dark {
  --background: 0 0% 3.9%;             /* Pitch Black #0a0a0a */
  --foreground: 0 0% 98%;              /* High Contrast White #fafafa */
  --card: 0 0% 3.9%;
  --card-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 9%;
  --secondary: 0 0% 14.9%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 14.9%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 0 0% 14.9%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 62.8% 30.6%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 0 0% 83.1%;
}
```

### 2.2 Typography & Font System
- **Primary Typeface:** Google Font **Poppins** (`400 Regular`, `500 Medium`, `600 SemiBold`, `700 Bold`) imported dynamically in page components.
- **System Fallback:** `Arial, Helvetica, sans-serif` for fast rendering across legacy POS touchscreen terminals.
- **Scale:**
  - **Hero / Dashboard Metrics:** `text-2xl` to `text-3xl font-bold tracking-tight`
  - **Section Titles & Headers:** `text-lg font-semibold text-orange-600`
  - **Body Text:** `text-sm leading-relaxed text-gray-700 dark:text-gray-200`
  - **Micro-Copy & Table Metadata:** `text-xs font-medium text-gray-500`

### 2.3 Component Design Language & Visual Tokens
1. **Frosted Glass Cards (`backdrop-blur-xl`):**
   - High-end cards with translucent white background `bg-white/80 dark:bg-zinc-900/80` and subtle `border border-gray-100 dark:border-zinc-800`.
   - Dynamic 2px gradient masked border on hover with 3D elevation: `-translate-y-1 scale-[1.02] shadow-xl`.
   - Horizontal shimmer highlight sweep animation `bg-gradient-to-r from-transparent via-white/10 to-purple-500/5`.
2. **Interactive Accent Buttons ([AccentButton.jsx](file:///Users/ideaind/Desktop/hotel-pos-system-main/components/AccentButton.jsx)):**
   - Vibrant linear gradients: `bg-gradient-to-r from-orange-500 to-orange-500 hover:from-orange-600 hover:to-orange-600`.
   - Tactile feedback: `active:scale-95 shadow-md hover:shadow-lg focus:ring-2 focus:ring-orange-500`.
3. **Receipt & Thermal Print Styling (`@media print`):**
   - Standard 80mm thermal receipt geometry (`size: 80mm auto; margin: 0; padding: 10px;`).
   - Thermal typography: High-contrast monospace formatting, crisp item dividers, zero box-shadows, and automated page breaks for Kitchen Order Tickets (KOT) and Final Customer Receipts.
4. **Custom Scrollbars & Layout Utilities:**
   - Slim custom scrollbars with bronze thumb (`.custom-scrollbar::-webkit-scrollbar-thumb { background-color: #d69551; border-radius: 50px; }`).
   - `.scrollbar-hide` for smooth horizontal category carousels on mobile and tablet terminals.
   - `.dfc` (`display: flex; justify-content: space-between; align-items: center;`) utility for fast responsive bar alignment.

---

## 3. Role-Based Access Control (RBAC) & Authentication

The platform enforces strict role-based permission gating via [lib/rbac.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/rbac.js) and [lib/auth.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/auth.js).

### 3.1 Role Hierarchy & Permissions Matrix

| System Role | Scope & Permissions | Core Accessible Modules |
| :--- | :--- | :--- |
| **`superadmin`** | Universal wildcard permission `["*"]`. Unrestricted access to all outlets, financial databases, staff password unmasking, system config. | All routes, settings, staff credentials, database overrides |
| **`Manager`** | Operations, culinary, inventory, staff, settlements, table & category management. | `/orders`, `/menu`, `/inventory`, `/reports`, `/analysis`, `/staff`, `/kitchen-display`, `/bills`, `/expenses`, `/settlements`, `/categories`, `/taxes`, `/admin/tables` |
| **`Cashier`** | Billing, payment processing, invoice generation, shift sales reports. | `/orders`, `/bills`, `/reports`, settlement logging |
| **`Chef`** | Kitchen order queue, recipe viewing, order prep updates. | `/kitchen-display`, `/menu`, `/orders` (view only) |
| **`Waiter`** | Order taking, table status assignment, item modifier selection, payment collection. | `/orders` (add/edit), `/menu`, table management, payment trigger |
| **`Bartender`** | Drink order intake, bar inventory tracking, drink station queue. | `/orders`, `/menu`, bar category items |
| **`Receptionist`** | Guest check-ins, table reservations, customer profiles, room service. | `/customers`, `/admin/tables`, `/orders`, `/reports` |
| **`customer`** | Self-ordering via QR menu, order status tracking, loyalty points, feedback. | `/customer/menu/[id]`, `/account`, `/feedback-form` |

### 3.2 Authentication & Security Architecture
- **JWT Storage:** Secure stateless JWT tokens persisted across `hotel_pos_jwt` cookies and `hotel_pos_user` local storage.
- **Route Protection:** Components wrapped with [ProtectedRoute.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/components/ProtectedRoute.js) and individual action controls wrapped with [ProtectedStaffAction.jsx](file:///Users/ideaind/Desktop/hotel-pos-system-main/components/ProtectedStaffAction.jsx).
- **Staff Credential Security:** Passwords stored securely; visibility toggle in staff lists is restricted strictly to `superadmin` role users.
- **Guest Order Verification:** Email OTP verification sent via Nodemailer to prevent fraudulent or accidental table submissions.

---

## 4. Comprehensive Feature Inventory & Modules

```mermaid
mindmap
  root((Hotel POS System))
    Front Office & POS
      Order Taking & POS Terminal
      Table Status Auto Management
      Kitchen Order Ticket KOT
      Split & Merged Billing
      Dual Print 80mm & A4
    Guest Self-Ordering
      Table QR Code Generation
      Contactless Digital Menu
      Email OTP Order Verification
      Customer Feedback & Ratings
      Customer Loyalty Points
    Kitchen Display KDS
      Real Time SSE Order Stream
      Audio Sound Chimes
      Prep Status Tracking
      Filter by Station / Type
    Inventory & Procurement
      Raw Materials & Stock Depletion
      Low Stock Warnings
      Supplier Directory & Purchasing
      Crockery & Housekeeping Tracking
    Financials & Administration
      Daily Cash Settlement
      Debtors & Customer Ledger
      Expense Tracking
      Tax Slabs GST & Service Charges
      Multi Outlet Management
      Executive Analytics & PDF/Excel Export
```

### 4.1 Order Management & POS Terminal (`/orders`, `/orders/new`, `/orders/edit`)
- **Multi-Channel Ordering:** Supports Dine-in, Takeaway, Delivery, and Room Service orders.
- **Real-Time Table State Sync:**
  - Table automatically transitions to **"Booked / Occupied"** the moment an order is recorded.
  - Table automatically transitions back to **"Available"** upon final bill settlement.
- **Live Search & Category Filtering:** Instant search with 300ms debouncing across food, beverages, and desserts.
- **Customizable Modifiers:** Add special cooking notes (e.g., "no onions", "extra spicy", "dressing on the side").
- **Cart Management:** Dynamic calculation of subtotal, tax breakdown, and service charges.

### 4.2 Kitchen Display System — KDS (`/kitchen-display`)
- **Real-Time Server-Sent Events (SSE):** Connected to `/api/events` for sub-second order delivery without database polling.
- **Acoustic Audio Chime:** Automatic audio chime triggers the moment a new order hits the kitchen station.
- **Visual Alert Modal:** Integrates with [AlertContext.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/context/AlertContext.js) showing high-priority alerts with quick links to pending tickets.
- **Prep Lifecycle Stages:** `Pending` → `Preparing` → `Ready for Pickup` → `Completed`.
- **Filtering by Station:** Separate views for Main Kitchen, Pantry, Bakery, and Bar.

### 4.3 Billing, Invoicing & Thermal Printing (`/bills`, `/components/BillPrintModal.js`)
- **80mm Thermal Receipt Generation:** Native ESC/POS-compatible receipt format featuring company header, GSTIN, FSSAI number, table info, itemized list, taxes, and customizable footer notes.
- **Full-Size Corporate Invoices (A4):** Powered by `jspdf` and `jspdf-autotable` for corporate guests and tax audits.
- **Multi-Method Tender:** Split payments across Cash, Credit/Debit Card, UPI / QR Code, and Room/Debtor billing.
- **Discount & Void Governance:** Controlled discount overrides with manager authorization and audit tracking.

### 4.4 Menu & Category Management (`/menu`, `/categories`, `/menu-display`)
- **Category Hierarchy:** Food, Beverages, Housekeeping, Crockery, and Bar items with emoji icons and rich color badges.
- **Item Master Details:** Title, Description, Base Price, Portion Sizes (Regular, Large, Half, Full), Tax Slab, Food Type (Veg, Non-Veg, Vegan).
- **Asset Storage via AWS S3:** High-resolution food images uploaded directly to S3 via `@aws-sdk/client-s3`.
- **Bulk Import / Export:** Support for mass importing menus using Excel spreadsheets (`xlsx`, `xlsx-js-style`) or JSON payloads (`menu_updated.json`).

### 4.5 Digital Contactless Menu & Customer Ordering (`/customer`, `/customer/menu/[id]`)
- **QR Code Table Association:** Unique QR code per table linking directly to `/customer/menu/[tableId]`.
- **Guest Cart Experience:** Seamless touch-optimized menu browsing, food filtering, and real-time total calculation.
- **OTP Verification via Email:** Customer submits email and receives a one-time passcode generated and verified via `/api/customers/send-otp` before orders are accepted.
- **Customer Account & History (`/account`):** Guest review of active and past orders, points balance, and saved preferences.

### 4.6 Table & Room Management (`/admin/tables`)
- **Dynamic Floor Plan:** Real-time visual grid of tables grouped by section (Indoor AC, Outdoor Garden, Rooftop Lounge, VIP Cabana).
- **Table States:** Color-coded status badges:
  - 🟢 **Available:** Ready for seating
  - 🟡 **Booked / Seated:** Order placed, currently dining
  - 🔴 **Occupied / Billed:** Awaiting payment clearance
  - ⚪ **Maintenance / Reserved:** Unavailable
- **Instant QR Generation:** On-demand printable QR stickers with custom restaurant branding for each table.

### 4.7 Inventory, Suppliers & Purchasing (`/inventory`, `/purchases`, `/suppliers`)
- **Multi-Category Tracking:** Ingredients, fresh vegetables, dairy, poultry, dry goods, bar spirits, cleaning chemicals, linens, and tableware.
- **Automated Stock Depletion:** Automatically decrements stock units based on recipe requirements upon order completion.
- **Low-Stock Alerts:** Real-time dashboard badges and email alerts when stock dips below safety reorder levels.
- **Procurement & POs:** Supplier directory with contact ledgers, purchase order generation, goods receipt notes (GRN), and invoice reconciliation.

### 4.8 Financial Control: Expenses, Debtors & Settlements (`/expenses`, `/debtors`, `/settlements`)
- **Daily Shift Settlement:** Reconciliation of physical drawer cash, credit card batch totals, UPI transaction logs, and discrepancies.
- **Debtors Ledger:** Comprehensive tracking of customer credit accounts, corporate meal credit, and pending receivables.
- **Expense Categorization:** Petty cash tracking for kitchen consumables, repairs, staff allowances, and logistics.

### 4.9 Tax & Compliance Management (`/taxes`, `/settings`)
- **Dual GST Architecture:** Indian GST compliance supporting CGST (Central), SGST (State), and IGST (Inter-state).
- **Custom Tax Rules:** Configurable tax rates for alcoholic beverages, tobacco, and luxury service charges.
- **Statutory Identifiers:** Dynamic display of restaurant GSTIN, FSSAI food license numbers, and legal disclaimer footers on all bills.

### 4.10 Multi-Outlet Management (`/outlets`)
- **Centralized Chain Oversight:** Support for multi-branch hotel and restaurant chains with individual outlet IDs.
- **Branch-Specific Isolation:** Dedicated inventory, local menu pricing overrides, and independent cash registers per outlet.
- **Consolidated Headquarters Reporting:** Cross-outlet sales comparisons, benchmark analytics, and inventory transfers.

### 4.11 Analytics, Dashboards & Reporting (`/`, `/reports`, `/analysis`)
- **Visual Analytics:** Interactive line charts, bar graphs, and area charts built with `recharts`.
- **Core KPI Metrics:** Today's Gross Sales, Order Count, Average Order Value (AOV), Table Turnover Rate, Peak Service Hours.
- **Staff Performance Tracking:** Orders booked, revenue generated, and tip distribution per server.
- **Export Capabilities:** One-click automated export to PDF and Excel spreadsheets with custom column styling.

### 4.12 Customer Feedback & Loyalty Program (`/feedback`, `/feedback-qr`, `/feedback-form`, `/loyalty`)
- **Instant QR Feedback:** Table tent cards with QR codes taking guests directly to mobile feedback forms.
- **Multi-Vector Ratings:** 5-star scoring across Food Quality, Service Speed, Ambiance, Cleanliness, and Value.
- **Loyalty Points Engine:** Earn configurable reward points per dollar/rupee spent, redeemable against future orders.

### 4.13 Progressive Web App (PWA), Web Push & Multilingual
- **PWA Ready:** Manifest and service worker via `next-pwa` with offline capability and custom install banner ([PWAInstallPrompt.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/components/PWAInstallPrompt.js)).
- **Web Push Notifications:** Real-time browser push notifications using `web-push` and VAPID keys for urgent manager and kitchen notifications.
- **Multilingual Support:** Integrated Google Translate widget ([TranslateWidget.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/components/TranslateWidget.js)) allowing staff and international guests to switch between English, Japanese, Hindi, and other languages.

---

## 5. System Architecture & Data Schema

### 5.1 Technology Stack Summary
```
Frontend:           Next.js 16.1.1 (App Router) + React 19.2.3
Styling:            TailwindCSS 3.4.17 + Tailwind Animate + Custom Glassmorphism
State & Context:    React Context (AuthContext, AlertContext, CartContext, OrdersContext)
Database:           MongoDB Driver 6.x (Replica Set / Atlas compatible)
Real-time / Push:   Server-Sent Events (SSE) + Web-Push 3.6.7 (VAPID)
Storage:            AWS S3 (@aws-sdk/client-s3 3.873.0)
Authentication:     JWT (jose 6.1.2) + HTTP-only cookies
Reporting / Print:  jsPDF + jsPDF-AutoTable, XLSX + XLSX-JS-Style, React-to-Print
Validation:         React Hook Form + Zod
```

### 5.2 MongoDB Collections Architecture

```mermaid
erDiagram
    USERS ||--o{ ORDERS : takes
    USERS {
        string _id
        string name
        string email
        string password
        string role
        array permissions
        string outletId
    }

    TABLES ||--o{ ORDERS : hosts
    TABLES {
        string _id
        string number
        string section
        int capacity
        string status
        string qrCodeUrl
    }

    CATEGORIES ||--o{ MENU_ITEMS : contains
    CATEGORIES {
        string _id
        string name
        string type
        string icon
    }

    MENU_ITEMS ||--o{ ORDER_ITEMS : specified_in
    MENU_ITEMS {
        string _id
        string name
        string categoryId
        float price
        string itemType
        string imageS3Url
        boolean isAvailable
    }

    ORDERS ||--|{ ORDER_ITEMS : includes
    ORDERS {
        string _id
        string orderNumber
        string tableNumber
        string orderType
        string status
        float totalAmount
        string customerEmail
        date createdAt
    }

    ORDERS ||--o| BILLS : settled_by
    BILLS {
        string _id
        string billNumber
        string orderId
        float subTotal
        float taxAmount
        float discount
        float finalAmount
        string paymentMode
        string cashierId
    }

    INVENTORY ||--o{ PURCHASES : replenished_by
    INVENTORY {
        string _id
        string itemName
        string category
        float currentStock
        string unit
        float minThreshold
    }
```

---

## 6. Directory Structure & Key Artifacts

```
hotel-pos-system-main/
├── app/                              # Next.js App Router (Pages & API)
│   ├── account/                      # Customer profile & self-service
│   ├── admin/                        # Admin sub-routes (tables, orders)
│   ├── analysis/                     # Advanced charts & sales analytics
│   ├── api/                          # REST & SSE backend endpoints
│   │   ├── auth/                     # JWT login & superadmin authentication
│   │   ├── bills/                    # Invoice generation & settlement
│   │   ├── customers/                # Guest directory & OTP dispatch
│   │   ├── events/                   # Server-Sent Events (SSE) real-time stream
│   │   ├── inventory/                # Stock levels & balance adjustments
│   │   ├── kitchen/                  # KDS status endpoints
│   │   ├── orders/                   # Order placement & table status triggers
│   │   ├── settings/                 # General, POS & notification settings
│   │   └── tables/                   # Table query & status patch endpoints
│   ├── bills/                        # Billing desk & thermal print triggers
│   ├── categories/                   # Menu & inventory category CRUD
│   ├── customer/                     # Contactless table QR menu & ordering
│   ├── customers/                    # CRM & customer directory
│   ├── debtors/                      # Unpaid customer balances & credit ledgers
│   ├── expenses/                     # Daily expense entries & petty cash
│   ├── feedback/                     # Feedback review portal
│   ├── feedback-form/                # Customer rating form
│   ├── feedback-qr/                  # QR generator for table feedback
│   ├── inventory/                    # Comprehensive stock tracking
│   ├── kitchen-display/              # Live KDS screen with audio chimes
│   ├── loyalty/                      # Customer reward points management
│   ├── menu/                         # Menu master management
│   ├── menu-display/                 # Digital TV menu screen
│   ├── orders/                       # POS terminal order desk
│   ├── outlets/                      # Multi-outlet chain configuration
│   ├── purchases/                    # Vendor purchase orders
│   ├── reports/                      # Sales, audit & performance reports
│   ├── settings/                     # Global POS settings & preferences
│   ├── settlements/                  # End-of-day register settlements
│   ├── staff/                        # Staff management & credentials
│   ├── suppliers/                    # Vendor & supplier profiles
│   ├── taxes/                        # GST & service charge rules
│   ├── globals.css                   # Print rules, scrollbars & CSS tokens
│   ├── layout.js                     # Root layout with providers & PWA
│   └── page.js                       # Primary dashboard with KPI cards
├── components/                       # Reusable UI components
│   ├── AccentButton.jsx              # Gradient tactile action button
│   ├── AdminHeader.js                # Administration navigation header
│   ├── BillPrintModal.js             # Thermal 80mm & A4 bill print engine
│   ├── CustomerHeader.js             # Guest portal header
│   ├── DashboardCards.js             # Glassmorphic permission-filtered cards
│   ├── Header.js                     # Main navigation bar with dropdowns
│   ├── ProtectedRoute.js             # Route-level RBAC wrapper
│   ├── ProtectedStaffAction.jsx      # Element-level permission wrapper
│   └── PWAInstallPrompt.js           # Progressive Web App install banner
├── context/                          # React context providers
│   ├── AlertContext.js               # Global modal alert & dialog system
│   ├── CartContext.js                # POS & customer shopping cart state
│   └── OrdersContext.js              # Real-time order state distribution
├── lib/                              # Shared utility libraries
│   ├── auth.js                       # Client-side auth provider & tokens
│   ├── db-config.js                  # Database connection settings
│   ├── email.js                      # Nodemailer SMTP engine for OTPs
│   ├── events.js                     # SSE broadcast emitter
│   ├── mongodb.js                    # MongoDB native client instance
│   ├── rbac.js                       # Permission tables & role validators
│   ├── s3Client.js                   # AWS S3 image storage client
│   └── webhook.js                    # Web Push registration & VAPID keys
├── styles/                           # Global stylesheets & theme variables
├── tailwind.config.ts                # Tailwind design system configuration
└── brain.md                          # Master System Architecture & Blueprint
```

---

## 7. Environment & Operational Configuration

The following environment variables configure the system's runtime behavior:

```env
# MongoDB Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/hotel_pos?retryWrites=true&w=majority
MONGODB_DB=hotel_pos

# Authentication
JWT_SECRET=your_super_secret_jwt_key_here

# AWS S3 Storage (Menu and Dish Photos)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
AWS_S3_BUCKET_NAME=hotel-pos-assets

# Email Service (Nodemailer for OTP & Low Stock Alerts)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=reservations@hotel-pos.com
SMTP_PASS=your_app_specific_password
FROM_EMAIL="Hotel-POS <reservations@hotel-pos.com>"

# Web Push Notifications (VAPID)
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BLXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VAPID_PRIVATE_KEY=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VAPID_SUBJECT=mailto:admin@hotel-pos.com

# Base Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 8. Deployment & Execution Runbook

### Development Server
```bash
# Install dependencies
npm install

# Start development server on port 3000
npm run dev
```

### Production Build
```bash
# Create optimized production build
npm run build

# Start production cluster
npm start
```

### Docker Container Deployment
```bash
# Build and run with Docker Compose
docker compose up hotel-pos --build
```

---

*This document serves as the canonical system blueprint (`brain.md`) for the Hotel POS Management System, establishing all feature behaviors, UI/UX aesthetics, database relations, and security guidelines across the codebase.*
