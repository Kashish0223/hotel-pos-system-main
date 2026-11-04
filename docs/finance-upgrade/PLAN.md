# Hotel POS — Finance Upgrade Phase Plan (Phases 0–8)

**Document:** `docs/finance-upgrade/PLAN.md`  
**Date:** 2 November 2026  
**Status:** Approved Execution Blueprint

---

## Phase Overview & Roadmap

| Phase | Title | Focus & Deliverables | Gate Requirement |
|---|---|---|---|
| **Phase 0** | **Repository Audit & Baseline** | Complete audit, baseline documentation, trace order-to-cash, risk matrix. Zero application code changes. | Evidence-backed audit in `docs/finance-upgrade/`; all previous clues validated. |
| **Phase 1** | **Contracts, Money & Secure Foundation** | Minor-unit money utilities, bcrypt password hashing migration, response redaction, idempotency primitives, finance RBAC middleware. | Test suite passes for integer money rounding, split residue, password migration, and authorization guards. |
| **Phase 2** | **Billing & Actual Payments** | Draft → Issued invoice lifecycle, immutable snapshots, atomic numbering, split tender, partial payments, payment receipts. | Concurrent issuance yields 1 bill; payments balance to 0 paise; partial payments leave correct due balance. |
| **Phase 3** | **Discounts, Credit Notes & Refunds** | Approved pre-issue discounts, manager thresholds, post-issue credit notes, refund ledger, restock vs wastage tracking. | All ₹500/₹300 test cases pass; unapproved discounts blocked; no cash hidden. |
| **Phase 4** | **Register Sessions & Cash Reconciliation** | Register shifts, opening float, cash receipts/change, cash drops, petty cash, counted vs expected cash variance. | Shift reconciliation handles multi-tender, midnight cutoff, and cash shortage/overage. |
| **Phase 5** | **Receivables, Expenses & Vendor Bills** | Debtor accounts, receivable ageing (0–30, 31–60, 60+), vendor bills, 3-way match, expense attachments. | Ageing matches ledger balances; copy-pasted auth bugs purged from debtors/expenses/purchases. |
| **Phase 6** | **Finance Reports & Accountant Exports** | Server-aggregated gross/net sales, tax, tenders, refunds, expenses, variance. Accountant CSV/Excel export with formula injection protection. | Aggregates match underlying invoice/payment sums; outlet & date filters accurate. |
| **Phase 7** | **Optional Odoo Connector** | Asynchronous outbox worker, stable external IDs, retry with exponential backoff, conflict resolution. Gated on real sandbox. | Sync verified against Odoo sandbox; POS operational during Odoo outage. |
| **Phase 8** | **Migration, Regression & Release Readiness** | Historical bills schema migration dry-run, rollback runbook, full POS regression (orders, KDS, tables, inventory, Ambrel dashboard). | Zero regressions across sibling routes; design strictly preserved. |

---

## Detailed Phase Breakdown

### Phase 0 — Audit & Documentation (Completed)
- **Goal:** Read-only repository audit, file-level verification, baseline defect capture.
- **Files Created:**
  - `docs/finance-upgrade/MASTER.md`
  - `docs/finance-upgrade/AUDIT.md`
  - `docs/finance-upgrade/DECISIONS.md`
  - `docs/finance-upgrade/CONTRACTS.md`
  - `docs/finance-upgrade/PLAN.md`
  - `docs/finance-upgrade/TESTS.md`
  - `docs/finance-upgrade/STATUS.md`
  - `docs/finance-upgrade/HANDOFF.md`
  - Root `STATUS.md` and `HANDOFF.md` updated.
- **Application Code Modified:** None.

---

### Phase 1 — Contracts, Money & Secure Foundation
- **Goal:** Build the bedrock utilities for exact accounting and repair critical credential exposure.
- **Proposed Files:**
  - `lib/finance/money.js`: Integer paise arithmetic, half-up rounding, residue split distributor.
  - `lib/finance/security.js`: Bcrypt password hashing, verification, and API response sanitizer.
  - `lib/finance/idempotency.js`: Atomic idempotency key guard with SHA-256 payload hashing.
  - `lib/finance/rbac.js`: Server-side finance permission guards.
  - `app/api/auth/login/route.js`: Update to verify bcrypt hashes with legacy plaintext migration.
  - `app/api/staff/route.js`: Apply projection `{ password: 0 }` to strictly sanitize staff output.
  - `app/staff/page.js`: Remove plaintext password DOM rendering.
- **Gate:** Automated unit tests verify all money rounding invariants; API security verified with no password leakage.

---

### Phase 2 — Billing & Actual Payments
- **Goal:** Replace instant "paid" generation with standard Draft → Issued billing and payment allocations.
- **Proposed Files:**
  - `app/api/finance/invoices/route.js`: List and filter invoices by date, outlet, payment status.
  - `app/api/finance/invoices/issue/route.js`: Atomic issuance, sequence counter, immutable snapshot.
  - `app/api/finance/payments/route.js`: Record payment receipts (split tender: cash, UPI, card).
  - `app/bills/page.js`: Update billing table to display true due amounts and split payment modal.
- **Gate:** Concurrent issuance check; split payment test (e.g. ₹500 split into ₹300 UPI + ₹200 Cash).

---

### Phase 3 — Legitimate Discounts, Credit Notes & Refunds
- **Goal:** Support approved pre-bill discounts and legal post-bill credit notes without altering issued invoices.
- **Proposed Files:**
  - `lib/finance/discounts.js`: Discount validation, manager threshold authorization.
  - `app/api/finance/credit-notes/route.js`: Linked credit note generation with tax reversal.
  - `app/api/finance/refunds/route.js`: Tender refund ledger tied to credit notes.
  - `components/finance/CreditNoteModal.jsx`: Reason-coded credit note dialog.
- **Gate:** Verification of all ₹500/₹300 scenarios; zero unlinked invoice updates.

---

### Phase 4 — Register Sessions & Cash Reconciliation
- **Goal:** Complete cash drawer lifecycle and shift reconciliation.
- **Proposed Files:**
  - `app/api/finance/sessions/route.js`: Open/close register shifts.
  - `app/api/finance/sessions/movements/route.js`: Cash in/out, petty cash, bank drops.
  - `app/settlements/page.js`: Modernized register shift dashboard utilizing existing theme tokens.
- **Gate:** Multi-operator shift handover test; cash variance correctly calculated and audited.

---

### Phase 5 — Receivables, Expenses & Vendor Bills
- **Goal:** Rectify copy-paste bugs in Debtors/Expenses/Purchases and establish proper receivables and payables.
- **Proposed Files:**
  - `app/api/debtors/route.js`: Purge copy-pasted staff auth bug; connect to customer invoice balances.
  - `app/api/expenses/route.js`: Purge copy-pasted staff auth bug; link to register cash-out if cash.
  - `app/api/purchases/route.js`: Cleanse bulk purchase validation; support vendor bill status.
  - `lib/finance/ageing.js`: Receivables ageing calculations (Current, 30d, 60d, 90d+).
- **Gate:** Debtors reconcile with unpaid invoice balances; duplicate vendor bill detection works.

---

### Phase 6 — Finance Reports & Accountant Exports
- **Goal:** Server-side financial aggregation and accountant CSV/Excel export.
- **Proposed Files:**
  - `app/api/finance/reports/route.js`: Comprehensive revenue, tax, tender, refund, and variance report.
  - `lib/finance/exports.js`: Sanitized CSV/XLSX generator with formula-injection mitigation (`=`, `+`, `-`, `@` escaped).
  - `app/reports/page.js`: Financial reports view displaying verifiable metrics.
- **Gate:** Screen figures equal export table sums; zero reliance on unbilled orders for revenue.

---

### Phase 7 — Optional Odoo Connector
- **Goal:** Enterprise ERP synchronization (Gated on real sandbox access and confirmed ownership).
- **Proposed Files:**
  - `lib/odoo/client.js`: Authenticated API client (JSON-2 or XML-RPC).
  - `lib/odoo/mapper.js`: Bidirectional entity mappings (Customers, Products, Invoices, Taxes).
  - `lib/odoo/outbox.js`: Durable transactional outbox worker.
- **Gate:** Live sandbox synchronization proof; timeout recovery and idempotent retry verified.

---

### Phase 8 — Migration, Regression & Release Readiness
- **Goal:** Safe transition of existing historical data and comprehensive regression validation.
- **Proposed Files:**
  - `scripts/migrate-finance.js`: Non-destructive historical bills transformer.
  - `docs/finance-upgrade/RUNBOOK.md`: Deployment, rollback, and operational instructions.
- **Gate:** 100% regression pass on POS ordering, KDS, tables, inventory, and Ambrel dashboard.
