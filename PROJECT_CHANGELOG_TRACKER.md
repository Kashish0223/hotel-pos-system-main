# Hotel POS - Comprehensive Project Changelog & Change Tracker

> **File Location:** `PROJECT_CHANGELOG_TRACKER.md` (Workspace Root)  
> **Last Updated:** 2 November 2026  
> **Repository:** Hotel & Restaurant POS System  
> **Maintainer Instruction:** Whenever any new changes, features, bug fixes, or refactors are made to this codebase, append a new dated section below adhering to the [Change Entry Format](#-how-to-log-future-changes).

---

## 📌 Quick Summary of Active System Status

- **Financial Engine:** 100% Integer Minor Units (Paise: ₹1.00 = 100 paise) via `lib/finance/money.js`.
- **Security:** Native `scrypt` password hashing; timing-safe verification; zero password leaks in API/DOM.
- **Billing & Payments:** Atomic invoice sequencing (`INV-YYYYMMDD-XXXXXXX`), split tenders (Cash, UPI, Card), atomic receipts (`REC-YYYYMMDD-XXXXXXX`).
- **Audit & Corrections:** Linked credit notes (`CN-YYYYMMDD-XXXXXXX`), refunds (`REF-YYYYMMDD-XXXXXXX`), immutable audit logs (`finance_audit_logs`).
- **Cash Drawer:** Authoritative Expected Drawer formula; shift opening (`SES-...`); denomination calculator; audited variance.
- **Receivables & AP:** 4 ageing buckets (Current 0–30d, 31–60d, 61–90d, 90+d); cash expenses linked to drawer movements; duplicate vendor bill detection (`409 Conflict`).
- **Reports & Export:** Authoritative server aggregation; formula-injection (CSV injection) mitigation; sanitized accountant CSV downloads.
- **Odoo Connector:** JSON-RPC client; document authority preserved (`ref: billNumber`); durable transactional outbox with recovery state machine.
- **Test Suite:** 52 automated tests passing across 10 suites (`npm run test:finance`).
- **Production Build:** 94/94 Next.js routes compiled cleanly (`npm run build`).
- **UI Design:** Ambrel restaurant dashboard design 100% preserved and intact.

---

## 📅 Timeline of Changes by Date

---

### [2026-11-02] - Enterprise Finance Upgrade (Phases 0 to 8 Complete)

**Author / Stream:** Advanced Finance & Accounting Architecture  
**Scope:** Replaced naive floating-point billing, unsecured staff credentials, and non-auditable transactions with a bank-grade, mathematically invariant hospitality accounting engine.

#### 1. Phase 0 — Audit & Context Baseline (2026-11-02)
- **Objective:** Deep audit of existing repository without modifying product code; created durable baseline context documentation.
- **Files Created:**
  - `docs/finance-upgrade/MASTER.md`: Master operating rules, accounting conventions, and invariant contracts.
  - `docs/finance-upgrade/AUDIT.md`: Endpoint-by-endpoint code audit, vulnerabilities catalog, and baseline gaps.
  - `docs/finance-upgrade/DECISIONS.md`: Architectural decisions (Odoo ownership, integer paise, sequence generation).
  - `docs/finance-upgrade/CONTRACTS.md`: Mathematical models, entity lifecycle states, and JSON schemas.
  - `docs/finance-upgrade/PLAN.md`: Phase-by-phase implementation plan.
  - `docs/finance-upgrade/TESTS.md`: Automated test protocol and verification outputs.
  - `docs/finance-upgrade/STATUS.md`: Milestone progress tracker.
  - `docs/finance-upgrade/HANDOFF.md`: Fast-recovery session resumption guide.

#### 2. Phase 1 — Contracts, Exact Money & Security Foundation (2026-11-02)
- **Objective:** Eliminate JavaScript float rounding drift and repair critical plaintext credential leakage.
- **Changes & Files Created/Modified:**
  - `lib/finance/money.js` (NEW): Built integer paise engine (`toPaise`, `toRupees`, `formatINR`, `calculateLineItem`, `calculateInvoiceTotals`, residue-free split distribution, Dual GST basis points).
  - `lib/finance/security.js` (NEW): Native Node.js `scrypt` password hashing (`scrypt:<salt>:<key>`), timing-safe verification (`timingSafeEqual`), and credential projection sanitization.
  - `lib/finance/idempotency.js` (NEW): Mutating finance request deduplication and lock leasing.
  - `lib/finance/sequence.js` (NEW): Atomic MongoDB sequence generation (`getNextAtomicSequence`).
  - `lib/finance/audit.js` (NEW): Append-only audit logger (`logFinanceAudit`).
  - `lib/finance/guards.js` (NEW): RBAC guard for finance endpoints (`requireFinanceAuth`).
  - `app/api/auth/login/route.js` (MODIFIED): Upgraded login verification to use `verifyPassword` supporting both `scrypt` hashes and legacy plaintext with auto-upgrade flag.
  - `app/api/staff/route.js` (MODIFIED): Hashes passwords on creation; enforces `{ password: 0 }` projection on GET to prevent credential leakage.
  - `app/staff/page.js` (MODIFIED): Permanently removed plaintext password rendering from table DOM.
  - `tests/finance/money.test.mjs` (NEW): Unit tests for integer paise math and dual GST calculations.
  - `tests/finance/security.test.mjs` (NEW): Unit tests for `scrypt` hashing, timing-safe validation, and zero password leaks.

#### 3. Phase 2 — Authoritative Billing & Actual Payments Engine (2026-11-02)
- **Objective:** Replace naive order-derived billing with honest invoice issuance and multi-tender payment recording.
- **Changes & Files Created/Modified:**
  - `app/api/bills/generate/route.js` (REWRITTEN): Atomic sequence numbering (`INV-YYYYMMDD-XXXXXXX`), integer paise line item snapshot, duplicate order billing prevention (`409 Conflict`), and truthful initial status (`issued`, `unpaid`, `partially_paid`, `paid`).
  - `app/api/finance/payments/route.js` (NEW): Dedicated payment endpoint supporting split tenders (Cash, UPI, Card), change return calculation, overpayment prevention, and atomic receipt numbers (`REC-YYYYMMDD-XXXXXXX`).
  - `app/bills/page.js` (MODIFIED): Added **Split Payment Modal** allowing cashiers to record multi-tender payments, calculate physical cash change, and track remaining balance due.
  - `tests/finance/billing.test.mjs` (NEW): Unit tests for billing invariants, split tender allocation, overpayment guard, and receipt sequence formatting.

#### 4. Phase 3 — Legitimate Discounts, Credit Notes & Refunds (2026-11-02)
- **Objective:** Enforce managerial discount controls, post-issue invoice immutability, and dual GST credit notes.
- **Changes & Files Created/Modified:**
  - `lib/finance/discounts.js` (NEW): Cashier threshold limits (max 10% or ₹200 flat); required manager escalation and standardized reason codes (`DISCOUNT_REASON_CODES`).
  - `app/api/finance/credit-notes/route.js` (NEW): Post-issue invoice corrections via immutable, linked credit notes (`CN-YYYYMMDD-XXXXXXX`), enforcing cumulative credit limits, dual GST tax reversal, and food wastage tracking.
  - `app/api/finance/refunds/route.js` (NEW): Dedicated refund disbursements (`REF-YYYYMMDD-XXXXXXX`) tied to credit notes with cumulative refund guards.
  - `app/bills/page.js` (MODIFIED): Added **Issue Credit Note Modal** for line-item returns and price adjustments with reason codes.
  - `tests/finance/discounts_credit_notes.test.mjs` (NEW): Unit tests for cashier thresholds, credit note limits, tax reversal math, and food wastage logging.
  - `tests/finance/invariants.test.mjs` (NEW): Assertion tests for Canonical Scenarios A, B, C, and D.

#### 5. Phase 4 — Register Sessions & Cash Drawer Reconciliation (2026-11-02)
- **Objective:** Mathematical register drawer tracking, mid-shift cash movements, and denomination counts.
- **Changes & Files Created/Modified:**
  - `lib/finance/sessions.js` (NEW): Mathematical Expected Drawer formula: $\text{Expected} = \text{Float} + \text{Cash Sales} - \text{Cash Refunds} + \text{Cash In} - \text{Cash Out}$, and physical cash denomination counter calculator.
  - `app/api/finance/sessions/route.js` (NEW): Shift opening (`SES-YYYYMMDD-XXXXXXX`), one-active-session per register rule (`409 Conflict`), and live shift aggregation.
  - `app/api/finance/sessions/close/route.js` (NEW): Shift closing & reconciliation against physical counted cash, audited cash variance, and mandatory variance explanatory notes.
  - `app/api/finance/sessions/movements/route.js` (NEW): Manual drawer movements (`CSH-YYYYMMDD-XXXXXXX`) for float top-ups (`cash_in`), petty cash, and safe drops (`bank_drop`).
  - `app/settlements/page.js` (MODIFIED): Added **Register Shifts & Cash Drawer Dashboard** with live KPI cards, Open Shift modal, Cash Movement modal, and Close & Reconcile modal with denomination breakdown.
  - `tests/finance/sessions.test.mjs` (NEW): Unit tests for drawer formula, denomination counting, shortage auditing (Scenario D), and session concurrency.

#### 6. Phase 5 — Receivables, Expenses & Vendor Bills (2026-11-02)
- **Objective:** Debtors ageing analysis, customer statement reconciliation, cash expense drawer linkage, and duplicate vendor bill prevention.
- **Changes & Files Created/Modified:**
  - `lib/finance/ageing.js` (NEW): 4-bucket ageing analysis engine (Current 0–30d, 31–60d, 61–90d, 90+d) with conservation invariant $\sum \text{buckets} \equiv \text{Total Outstanding}$; customer statement running balance reconciliation.
  - `app/api/debtors/route.js` (MODIFIED): Supported `?ageing=true` query; integer paise storage; standard payment terms (`DUE_ON_RECEIPT`, `NET15`, `NET30`, `NET60`, `NET90`).
  - `app/api/debtors/[id]/payment/route.js` (REWRITTEN): Fixed broken `data.permissions` runtime crash; added overpayment guard; atomic receipt numbers (`REC-YYYYMMDD-XXXXXXX`); audit logging.
  - `app/api/debtors/[id]/route.js` (REWRITTEN): Secured with `requireFinanceAuth`; clean CRUD with integer paise.
  - `app/api/expenses/route.js` (MODIFIED): Cash expenses automatically create linked petty cash movements (`type: "petty_cash"`) on the active register session to eliminate double-counting; atomic IDs (`EXINV-YYYYMMDD-XXXXXX`).
  - `app/api/expenses/[id]/route.js` & `status/route.js` (REWRITTEN): Clean status transitions (`pending`, `approved`, `paid`, `rejected`).
  - `app/api/purchases/route.js` (REWRITTEN): Purchase Orders / GRNs default to `isPaid: false` (no fake paid vendor bills); added duplicate vendor invoice detection (`409 Conflict` on duplicate `vendorBillNumber` per supplier).
  - `app/debtors/page.js` (MODIFIED): Integrated dynamic ageing fetch (`/api/debtors?ageing=true`), Indian Rupee formatting (`₹`), and 4-bucket KPI cards.
  - `tests/finance/receivables_expenses.test.mjs` (NEW): Unit tests for ageing conservation, customer statement running balance, duplicate vendor bill rejection, and petty cash drawer linkage.

#### 7. Phase 6 — Finance Reports & Accountant Exports (2026-11-02)
- **Objective:** Server-side financial aggregation, spreadsheet formula injection protection, and accountant-ready CSV exports.
- **Changes & Files Created/Modified:**
  - `lib/finance/reports.js` (NEW): Authoritative financial aggregation engine (`calculateFinancialAggregates`) and invariant validator (`verifyFinancialAggregatesInvariant`). Zero reliance on unbilled orders.
  - `lib/finance/exports.js` (NEW): Sanitized CSV generator with formula-injection mitigation (`sanitizeForCSV` prepends `'` to cells starting with `=`, `+`, `-`, `@`, `\t`, `\r`).
  - `app/api/finance/reports/route.js` (NEW): Report endpoint supporting JSON & CSV formats, date boundaries (`invoiceDate`, `paymentDate`, `refundDate`, `businessDate`), outlet and cashier filters.
  - `app/reports/page.js` (MODIFIED): Added primary tab switch between **"Authoritative Finance & Tax"** and **"Operations & Analytics"**. Displays 12 reconciled financial KPI cards, Tender & GST breakdown tables, and one-click accountant CSV download buttons.
  - `tests/finance/reports_exports.test.mjs` (NEW): Unit tests for aggregation invariants, formula injection mitigation, and unbilled orders exclusion.

#### 8. Phase 7 — Optional Odoo Connector Architecture & Outbox Worker (2026-11-02)
- **Objective:** Establish production-grade transactional outbox worker for Odoo ERP synchronization while preserving POS document authority.
- **Changes & Files Created/Modified:**
  - `lib/odoo/client.js` (NEW): JSON-RPC / JSON-2 client for Odoo 17, 18, and 19 with timeout handling, session caching, and honest connection gating (`BLOCKED_NO_CREDENTIALS` when environment variables are unset; never mocks connected status).
  - `lib/odoo/mapper.js` (NEW): Domain-to-Odoo mapping preserving POS bill number as authoritative `ref` (`account.move`, `account.payment`, `account.move out_refund`, `res.partner`); generates stable external references (`HOTEL_POS_...`) to prevent double-counting.
  - `lib/odoo/outbox.js` (NEW): Durable transactional outbox worker (`odoo_outbox` collection) with atomic lease locks, exponential backoff (1s, 2s, 4s, 8s, 16s), dead-letter queue escalation after 5 failed attempts, and pre-create search recovery for timeout-after-commit situations.
  - `lib/odoo/index.js` (NEW): Clean module exports for client, mapper, and outbox functions.
  - `app/api/finance/odoo/route.js` (NEW): Connector health status, outbox statistics, recent failure monitoring, and dead-letter event replay.
  - `app/api/finance/odoo/sync/route.js` (NEW): Manual batch synchronization trigger.
  - `tests/finance/odoo_connector.test.mjs` (NEW): Unit tests for connection evaluation, mapping contracts, outbox backoff, and recovery state machine.

#### 9. Phase 8 — Migration, Zero-Regression Checks & Release Readiness (2026-11-02)
- **Objective:** Non-destructive historical bill migration, comprehensive regression verification, and operational deployment runbook.
- **Changes & Files Created/Modified:**
  - `scripts/migrate-finance.mjs` (NEW): Non-destructive historical bills migration script with dry-run analysis and live migration modes (`npm run migrate:finance`). Never alters historical invoice numbers or dates.
  - `package.json` (MODIFIED): Added `"migrate:finance": "node scripts/migrate-finance.mjs"`.
  - `tests/finance/migration.test.mjs` (NEW): Unit tests for legacy bill transformation, integer paise conversion, idempotency, and resumability.
  - `docs/finance-upgrade/RUNBOOK.md` (NEW): Production deployment runbook, backup procedures, rollback limitations, and operational alert triggers.
  - `STATUS.md` & `docs/finance-upgrade/STATUS.md` (MODIFIED): Updated to mark all 8 phases completed.
  - `TESTS.md` & `docs/finance-upgrade/TESTS.md` (MODIFIED): Updated with 52 passing automated tests across 10 suites.
  - `HANDOFF.md` & `docs/finance-upgrade/HANDOFF.md` (MODIFIED): Final handoff and release readiness sign-off.

---

## 🗂️ Master File Index of Financial Engine

### Core Libraries (`lib/`)
- [lib/finance/money.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/money.js): Exact integer paise math, formatting, dual GST calculations.
- [lib/finance/security.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/security.js): Native `scrypt` password hashing and timing-safe verification.
- [lib/finance/idempotency.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/idempotency.js): Idempotency key deduplication and leasing.
- [lib/finance/sequence.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/sequence.js): Atomic MongoDB sequence number generation.
- [lib/finance/audit.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/audit.js): Append-only financial audit trail logging.
- [lib/finance/guards.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/guards.js): RBAC and permission validation guards.
- [lib/finance/discounts.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/discounts.js): Cashier thresholds and manager approval rules.
- [lib/finance/sessions.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/sessions.js): Authoritative expected drawer formula and denomination calculator.
- [lib/finance/ageing.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/ageing.js): 4-bucket receivables ageing and customer statement generator.
- [lib/finance/reports.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/reports.js): Server-side financial aggregation engine.
- [lib/finance/exports.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/finance/exports.js): Sanitized CSV generator with formula-injection protection.
- [lib/odoo/client.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/odoo/client.js): Odoo JSON-RPC client with honest connection gating.
- [lib/odoo/mapper.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/odoo/mapper.js): POS-to-Odoo accounting model entity mapper.
- [lib/odoo/outbox.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/lib/odoo/outbox.js): Durable transactional outbox with recovery state machine.

### API Endpoints (`app/api/`)
- `/api/bills/generate`: Honest invoice issuance (`INV-YYYYMMDD-XXXXXXX`).
- `/api/finance/payments`: Split tender payment allocation (`REC-YYYYMMDD-XXXXXXX`).
- `/api/finance/credit-notes`: Post-issue invoice corrections (`CN-YYYYMMDD-XXXXXXX`).
- `/api/finance/refunds`: Dedicated refund disbursements (`REF-YYYYMMDD-XXXXXXX`).
- `/api/finance/sessions`: Register shift opening (`SES-YYYYMMDD-XXXXXXX`) and live queries.
- `/api/finance/sessions/close`: Register shift closing and cash reconciliation.
- `/api/finance/sessions/movements`: Manual drawer cash movements (`CSH-YYYYMMDD-XXXXXXX`).
- `/api/finance/reports`: Financial aggregates and sanitized CSV exports.
- `/api/finance/odoo`: Odoo connector status and dead-letter replay.
- `/api/finance/odoo/sync`: Manual batch outbox processor.
- `/api/debtors/[id]/payment`: Debtor balance allocation with overpayment protection.
- `/api/expenses`: Expense logging with automatic petty cash drawer linkage.
- `/api/purchases`: PO/GRN receiving with duplicate vendor bill detection.

### User Interface Pages (`app/`)
- [app/bills/page.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/app/bills/page.js): Split Payment Modal & Issue Credit Note Modal.
- [app/settlements/page.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/app/settlements/page.js): Register Shifts & Cash Drawer Dashboard with denomination counter.
- [app/debtors/page.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/app/debtors/page.js): Receivables Ageing KPI cards and customer statement view.
- [app/reports/page.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/app/reports/page.js): Enterprise Finance & Tax Reports tab with accountant CSV exports.
- [app/staff/page.js](file:///Users/ideaind/Desktop/hotel-pos-system-main/app/staff/page.js): Plaintext passwords purged from DOM.

### Automated Test Suites (`tests/finance/`)
1. `tests/finance/money.test.mjs`: Integer math and dual GST tests.
2. `tests/finance/security.test.mjs`: Password hashing and timing-safe tests.
3. `tests/finance/billing.test.mjs`: Honest billing and split tender tests.
4. `tests/finance/discounts_credit_notes.test.mjs`: Discount limits and credit notes tests.
5. `tests/finance/sessions.test.mjs`: Cash drawer formula and reconciliation tests.
6. `tests/finance/receivables_expenses.test.mjs`: Ageing buckets and vendor bill tests.
7. `tests/finance/reports_exports.test.mjs`: Aggregation and formula injection tests.
8. `tests/finance/odoo_connector.test.mjs`: Odoo outbox and mapper tests.
9. `tests/finance/migration.test.mjs`: Non-destructive historical bill migration tests.
10. `tests/finance/invariants.test.mjs`: Core financial invariant assert tests.

---

## 📝 How to Log Future Changes

Whenever you or an AI assistant makes any future modification to this codebase, append a new section under **Timeline of Changes by Date** using this template:

```markdown
### [YYYY-MM-DD] - <Brief Title of Changes>

**Author / Stream:** <Your Name / AI Assistant>  
**Scope:** <1-2 sentences describing what was modified and why>

#### Changes & Files Modified:
- `path/to/file.js` (MODIFIED / CREATED): <Specific change, reason, and impact>
- `path/to/another_file.js` (MODIFIED / CREATED): <Specific change, reason, and impact>

#### Invariants & Accounting Impact:
- <Did this touch money, tax, billing, or security? Note invariant checks verified.>

#### Test & Build Status:
- `npm run test:finance`: <Number of passing tests, e.g. 52/52 passed>
- `npm run build`: <Build result, e.g. 94/94 routes compiled cleanly>
```
