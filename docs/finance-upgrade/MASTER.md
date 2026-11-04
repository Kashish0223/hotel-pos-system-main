# Hotel POS — Finance Upgrade Master Contract & Boundary Specification

**Prepared:** 2 November 2026  
**Status:** Canonical Reference Specification  
**Location:** `docs/finance-upgrade/MASTER.md`

---

## 1. Executive Intent & Operating Contract

This contract governs the transformation of the Hotel POS repository from an operational restaurant system into a robust, financially auditable POS with enterprise accounting workflows and an optional Odoo ERP connector.

### Core Principles
1. **Repository Authority:** The current repository and running application code are authoritative. Historical documentation, prompt blueprints, and past plans are historical context, not proof of implementation.
2. **Strict Design Preservation:** The newly updated Ambrel-style restaurant dashboard design (`components/dashboard/`, `lib/dashboard/`, `components/dashboard/dashboard.module.css`, Urbanist typography, clay/sage/sand/sky pastel cards, 252px/84px sidebar) MUST NOT be modified or regressed. Sibling route layouts are preserved.
3. **Phase-by-Phase Discipline:** Work proceeds strictly in bounded phases. Only the named phase may be executed. Each phase must produce verifiable evidence, pass quality gates, update persistent context documents, and stop.
4. **No Premature Application Edits:** Phase 0 is read-only documentation and audit. No application source code is modified in Phase 0.
5. **No Double Invoicing / No Alternate Books:** Invoices, credit notes, discounts, and payments must represent real economic events truthfully. Never hide sales, suppress cash transactions, generate fake discounts, or produce diverging export figures for management vs accountants.

---

## 2. Invariant Financial Rules (The ₹500 / ₹300 Rules)

| Scenario | Real Event | Correct Ledger & Document Representation |
|---|---|---|
| **A** | ₹500 price, genuine approved ₹200 discount before bill issue | Gross: ₹500, Discount: ₹200, Net/Invoice Total: ₹300, Collection: ₹300. Original price and discount line item preserved. |
| **B** | ₹500 final issued invoice, customer pays ₹300 | Invoice Total: ₹500, Cash Collected: ₹300, Outstanding Receivable: ₹200. Invoice amount is NOT reduced to ₹300. |
| **C** | ₹500 paid in full, customer granted genuine ₹200 post-issue correction/refund | Original ₹500 invoice remains immutable. Linked Credit Note of ₹200 issued. Cash/Tender Refund of ₹200 recorded. Net retained revenue: ₹300. |
| **D** | ₹500 cash collected, register drawer count reveals only ₹300 present | Recorded Sales: ₹500. Recorded Collections: ₹500. Cash Drawer Variance: ₹200 Shortage. Discrepancy is audited as an operational cash loss, NOT a reduction of sales. |
| **E** | Customer pays ₹500, request made to record ₹300 without adjustment | **REJECTED.** The system strictly prohibits unevidenced revenue suppression or unlinked parallel figures. |

---

## 3. Odoo-Style Workflows vs Actual Odoo Integration

The repository distinguishes between:
1. **Odoo-Style Workflows (Phases 1–6, 8):** Implementing standard enterprise financial patterns natively within this POS:
   - Immutable issued invoices with independent line-item snapshots.
   - Separate operational orders, invoice documents, and payment receipts.
   - Linked credit notes and audited refunds.
   - Cash register sessions with opening float, cash drops, petty cash, and drawer reconciliation.
   - Accounts receivable ageing and supplier purchase bills.
   - Server-aggregated financial summaries and accountant-ready export tables.
2. **Actual Odoo Connector (Phase 7):**
   - Strictly optional and gated on a confirmed real Odoo database, confirmed accounting ownership, verified Odoo version/API support (e.g. Odoo 19 JSON-2 or XML-RPC), and dedicated sandbox credentials.
   - Never mock a connector and claim it is connected.
   - Never count both a POS local sale and an imported Odoo sale as double revenue.

---

## 4. Minimum Security & Credential Invariants

1. **Staff Passwords:** Passwords must NEVER be stored in plaintext, returned in API responses, or rendered in UI tables. A migration to one-way salted hashing (e.g., bcrypt / Argon2) with response sanitization is a mandatory prerequisite before production.
2. **Server-Side Authorization:** Every finance mutation, query, and export endpoint must verify identity, role, permissions, and tenant/outlet scope on the server. UI role toggles or client cookies are never trusted.
3. **Immutable Audit Trail:** Financial actions (invoice issuance, discounts, voids, credit notes, refunds, drawer closures) must record an immutable audit entry containing actor ID, approver ID, timestamp, reason code, and financial snapshot.

---

## 5. Durable Context Protocol

The project maintains the canonical finance documentation suite in `docs/finance-upgrade/`:
- `MASTER.md`: Master contract, boundaries, and financial invariants.
- `AUDIT.md`: Feature verification matrix, symbol-level evidence, identified defects, and baseline failures.
- `DECISIONS.md`: Architectural decision records (ADRs) and unresolved business questions.
- `CONTRACTS.md`: Mathematical definitions, money formats, state diagrams, API specs, and schemas.
- `PLAN.md`: Structured Phase 0–8 breakdown with exact file targets and gates.
- `TESTS.md`: Test execution commands, baseline verification results, and required test suites.
- `STATUS.md`: Active progress tracker, working tree status, and next phase trigger.
- `HANDOFF.md`: Compact resumption instructions, key files, and open decisions.
