# Architecture Decision Records (ADRs) & Financial Policies

**Document:** `docs/finance-upgrade/DECISIONS.md`  
**Date:** 2 November 2026  
**Status:** Approved Architectural Baseline for Phase 1+

---

## 1. Architectural Decision Records (ADRs)

### ADR-01: Modular Monolith Architecture
- **Context:** The application is built with Next.js (App Router) and MongoDB. We must decide whether to extract finance and Odoo synchronization into separate services or keep them within the current monolith.
- **Decision:** Keep finance services within the Next.js application as a modular monolith (`lib/finance/`, `app/api/finance/`).
- **Rationale:** Minimizes operational complexity, avoids distributed transaction overhead, preserves existing deployment simplicity, and prevents premature network boundaries.

### ADR-02: Authoritative Invoice Issuance Ownership
- **Context:** If an optional Odoo integration is connected, we must determine which system issues the legal tax invoice number and acts as source of truth.
- **Decision:** POS is the authoritative issuer for all guest and restaurant invoices (`INV-YYYYMMDD-XXXXXXX`). Odoo receives posted invoices, payments, and credit notes asynchronously via an outbox worker.
- **Rationale:** The restaurant cannot halt table turn or guest checkout during internet outages or ERP downtime. Two systems must never issue independent tax invoice sequences for the same sale.

### ADR-03: Canonical Money Representation in Integer Minor Units (INR Paise)
- **Context:** Current code uses binary floating point (`Number(subtotal)`) and strings (`.toFixed(2)`), introducing rounding discrepancies and blocking database arithmetic aggregations.
- **Decision:** All monetary values stored in database documents and computed in financial services MUST use integer minor units (paise: ₹1.00 = 100 paise).
- **Rule:** Client adapters format paise into decimal strings (`"₹120.00"`) for display only. No accounting calculation is performed in floating point.

### ADR-04: Strict Decoupling of Operational, Invoice, and Payment Lifecycles
- **Context:** Current code treats orders and bills interchangeably and marks bills "paid" immediately upon generation.
- **Decision:** Enforce three distinct lifecycles:
  1. **Operational Order:** (Kitchen/Bar/Table) `pending` → `preparing` → `ready` → `served` → `completed` / `cancelled`.
  2. **Invoice Document:** `draft` → `issued` → `credit_reversed`. Issued invoices are immutable snapshots.
  3. **Payment State:** Derived from payment ledger allocations: `unpaid` → `partially_paid` → `paid` → `refunded`. A bill is only paid when cumulative verified allocations equal invoice total.

### ADR-05: Register Sessions & Cash Drawer Reconciliation
- **Context:** Settlements currently record a payment method string without tracking cash drawer state, opening float, or physical counts.
- **Decision:** Introduce `register_sessions` and `cash_movements`. An operator opens a session with an opening float, records sales/receipts, cash drops, petty cash payouts, and performs an end-of-shift cash count. Expected vs Counted variance is recorded explicitly.

### ADR-06: Credential Security & Password Migration
- **Context:** Passwords are currently stored and leaked in plaintext.
- **Decision:** In Phase 1, introduce bcrypt password hashing for all staff authentication. Existing plaintext passwords will be seamlessly upgraded to bcrypt hashes on their next login, and API projections will strictly omit `{ password: 0 }`.

### ADR-07: Design System Preservation
- **Context:** The restaurant dashboard was recently redesigned with an Ambrel theme (`components/dashboard/`, `lib/dashboard/`).
- **Decision:** The dashboard design and sibling route layouts (`/bills`, `/orders/new`, `/kitchen-display`, etc.) are frozen and preserved. All finance UI additions must adopt existing token classes (`components/dashboard/dashboard.module.css` or native Tailwind utilities) without altering established layouts.

---

## 2. Unresolved Business Questions Requiring Clarification

The following policy decisions should be confirmed prior to Phase 2/3 execution:

1. **Odoo Target & Scope:**
   - Is an actual external Odoo ERP instance required immediately, or is the goal to provide native Odoo-style enterprise workflows within the existing POS?
   - If a real Odoo instance is required: What is the Odoo version (e.g. Odoo 17, 18, 19), hosting environment (Odoo.sh, On-Premise, Odoo Online), and available sandbox credentials?
2. **Legal Entity & GST Registration:**
   - Single legal entity or multiple outlet legal entities?
   - What is the registered GSTIN and legal business name for invoice headers?
   - Is restaurant dining taxable under composition scheme (5% without ITC) or regular rates with liquor/tobacco segregation?
3. **Cash Drawer & Variance Policy:**
   - What is the standard opening float amount per shift?
   - What is the acceptable drawer discrepancy threshold before requiring mandatory manager sign-off?
4. **Discount & Refund Authorization:**
   - What is the maximum percentage/amount discount a cashier can apply before requiring manager PIN approval?
   - When a bill is refunded or items voided, what is the default return-to-stock policy (wastage vs restock)?
5. **Business Day Cutoff:**
   - Does the business day reset at 00:00 (midnight) or at an operational cutoff (e.g. 02:00 AM) to accommodate late-night dining?
6. **Historical Data Handling:**
   - Should existing legacy bills in the database remain untouched as read-only historical records, or is a migration into the new schema required?
