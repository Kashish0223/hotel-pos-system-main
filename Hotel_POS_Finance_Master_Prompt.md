# Hotel POS — Finance upgrade and optional Odoo integration
Prepared: 2 November 2026

## How to use — Hinglish
Antigravity mein latest actual project folder kholo. Yeh file attach karo aur neeche MASTER PROMPT paste karo. Pehla command: `Execute Phase 0 only.` Har phase ka evidence dekhne ke baad next phase chalao. Nayi chat mein isi file ke saath generated STATUS.md aur HANDOFF.md do. Purana dashboard redesign prompt dobara execute mat karwana.

This deliverable analyses two supplied Markdown documents, not a current code repository. No implementation, build, security audit or latest UI verification has been performed here.

## What the supplied files establish

| Area | Documented baseline | Required verification |
|---|---|---|
| Stack | Next.js 16, React 19, Tailwind 3, native MongoDB driver, SSE, S3, PWA | Current package/lock files and imports |
| Billing | /bills, BillPrintModal.js, 80mm/A4 printing, split tender | Real calculation, posting, retry and payment behavior |
| Existing finance | /expenses, /debtors, /settlements, /taxes, suppliers/purchases | Actual routes, authorization, models and correctness |
| Operations | Orders, KDS, QR menu, tables, inventory, multi-outlet | Regression baseline and actual implemented scope |
| Design | Earlier Ambrel-style redesign instructions | User says design changed; latest working UI is authoritative |
| Dashboard | Earlier prompt reports order-based sales totals and API/widget gaps | Recheck current queries; order value is not proof of cash received |
| Security | Brain mentions password visibility and client route guards | Inspect hashing, response redaction and server authorization; do not assume security |

The blueprint includes aspirations and inconsistencies. For example, its flow diagram suggests table release at served/completed status while its text says settlement; verify the actual lifecycle. Its claim of ESC/POS compatibility does not establish a working hardware printer integration. Its password visibility claim conflicts with expectations of one-way hashing. Treat all these as investigation points, not confirmed current defects.

## Recommended scope and priority
1. First: reliable invoice lifecycle, exact calculations, payments, legitimate discounts, credit notes/refunds, cash shifts, permissions and audit history.
2. Next: receivables ageing, supplier bills/payables, expenses/attachments, daily reconciliation and accountant exports.
3. Then: optional actual Odoo connector, with a confirmed accounting owner and tested synchronization.
4. Later: room folios/PMS integration, recipe cost and wastage reports, procurement approval/three-way matching, payment settlement imports and exception alerts. Do not label estimated food margins as full accounting profit.

Odoo-style workflows and connecting an actual Odoo database are different deliverables. Default to strengthening this existing POS with Odoo-style workflows. Do not silently install Odoo, replace MongoDB, create a second full ERP, or claim a connection without a real sandbox.

## Honest handling of the ₹500 / ₹300 example
Amounts here illustrate totals only; tax treatment depends on configured rules.

| Real event | Correct representation |
|---|---|
| ₹500 price, genuine approved ₹200 discount before issue | Gross ₹500, discount ₹200, final ₹300, collection ₹300 |
| ₹500 final invoice, customer pays ₹300 | Invoice ₹500, collected ₹300, outstanding ₹200 |
| ₹500 paid, genuine ₹200 correction/refund later | Original ₹500 retained, linked credit note ₹200 and actual refund ₹200; net retained ₹300 |
| ₹500 paid, only ₹300 present in drawer | Sales/payment remain ₹500; record ₹200 cash shortage and investigation |
| ₹500 received, request to show ₹300 without genuine adjustment | Unsupported; never hide the remaining sale or maintain alternate books |

# MASTER PROMPT — BEGIN

Act as a senior software architect, frontend engineer, backend engineer and financial-systems engineer. Extend my existing hotel/restaurant POS with reliable finance workflows and, optionally, a real Odoo connector. Preserve my newly changed UI and working operations.

Execute only the named phase. Begin with Phase 0. Finish the phase's bounded work and verification, update persistent context documents, report evidence, then stop. Do not ask permission for routine reversible work inside the named phase. Ask only for genuinely blocking business decisions or unavailable access. Do not implement all phases in one giant patch.

## 1. Evidence and scope contract
- Current repository and running application are authoritative for implementation. Supplied documents are historical context, not proof that features exist.
- Read applicable AGENTS.md, git status, package files, scripts and current docs. Preserve unrelated edits; no reset --hard, forced checkout, database wipe or wholesale rewrite.
- Label findings VERIFIED, DOCUMENTED-UNVERIFIED, PROPOSED or BLOCKED. Every verified feature needs actual path/symbol and evidence. Never invent file paths, endpoints, fields, test results, Odoo methods, migrations or UI screenshots.
- Preserve latest logo, fonts, theme tokens, sidebar, responsive layout, dark mode, providers, authentication and existing routes. Capture the actual UI before editing. Do not restore the old glassmorphism or rerun the earlier dashboard redesign.
- Extend existing billing/payment/settlement services where sound. Do not create duplicate invoice engines or conflicting finance pages. Suggested names in this prompt are proposals, not asserted existing files.
- Keep changes small, explain each dependency, use the repository's language conventions. No Next/React upgrades, database migration, TypeScript conversion or new microservices just for this task.
- No hidden sales, selective cash suppression, fake discounts/refunds, alternate invoice totals, backdated concealment or different totals for accountant and owner exports. Legitimate corrections must retain their original linked records.
- Never expose staff passwords. Verify hashes and redacted API responses; if recoverable passwords exist, plan migration and reset without logging or copying their values. UI permission wrappers do not substitute for API authorization.
- Use sanitized fixtures and a development database. Do not use real payments, send customer communications, deploy, run production migrations or sync real accounting records during development.

## 2. Durable context protocol
Create and maintain docs/finance-upgrade/:
- MASTER.md: this contract and bounded requirements.
- AUDIT.md: feature matrix, file/symbol evidence, actual schemas, defects and baseline failures.
- DECISIONS.md: architecture decisions, options, selected ownership and unresolved questions.
- CONTRACTS.md: money/tax definitions, lifecycle diagrams, APIs, permissions and index contracts.
- PLAN.md: phase tasks and exact proposed files.
- TESTS.md: test commands, observed results and missing coverage.
- STATUS.md: current phase, completed/pending/blocked items, working tree/commit context and next action.
- HANDOFF.md: compact restart instructions, essential files and unresolved decisions.

At every phase start, read MASTER, STATUS, HANDOFF and relevant decisions; inspect actual changes since the previous checkpoint. Update these after each completed meaningful milestone. If context is getting short, checkpoint first. On restart, resume the first incomplete task; never reconstruct progress from memory or claim unexecuted tests passed.

## 3. Financial contracts to define before implementation

### Money and tax
Use integer minor units for stored monetary amounts (INR paise) or a deliberately selected exact-decimal design consistent across API/database. Do not calculate accounting totals with uncontrolled binary floating point. Define decimal quantity precision, percentage precision, rounding mode, line-vs-invoice rounding and allocation of residual paise across split bills. Serialize amounts consistently; validate bounds and overflow.

Recalculate on the server using authoritative item prices, tax settings and authorized adjustments. Client totals are previews, never trusted inputs. Invoice snapshots retain item labels, quantities, unit prices, tax rules, discounts, business identity and calculation-version details at issue time. Later menu/tax edits cannot alter an issued invoice.

Define gross/net sales, tax, service charge, tips, collections, refunds, receivables, customer credits and cash variance separately. Dashboard reports must identify date basis and whether amounts include tax. Use configured outlet timezone and business-day cutoff. Do not hard-code GST rates or certify tax compliance from this prompt; confirm actual registration/localization and accountant-reviewed settings before production.

### Separate operational, document and payment lifecycles
Keep order preparation status separate from invoice document status and derived payment status. Proposed document states: draft → issued; subsequent changes through linked credit/reversal documents. Payment state is derived from allocations, not an arbitrary paid boolean.

Drafts may be edited with optimistic concurrency. Issued invoices cannot be silently rewritten/deleted, including by superadmin. Corrections use traceable credit notes or permitted void-and-reissue rules. Retain voided numbers and reasons; never reuse them. Distinguish a pro forma preview, an issued invoice and a payment receipt.

Support multiple payments per invoice and allocations for split/merged bills without double-counting items or revenue. Register actual receipts independently from cash tendered/change. Define credit-note allocation, refunds and unapplied customer credits so balances remain explainable. A credit note is not proof that money was refunded. A refund is not a second revenue reversal.

Prevent payment/refund race conditions, over-refunds, repeated issue and stale edits through unique constraints, atomic updates/transactions and version checks. Define scope for numbering (legal entity, outlet/series and financial period as applicable); allocate atomically. Never use count()+1.

### Minimum security and audit
Enforce authenticated identity, role/action permissions, tenant/legal-entity and outlet scope at every finance read/mutation/export endpoint. Never trust client-supplied role or outlet as authority. Include CSRF protection where cookie-based auth requires it. Validate all mutation payloads server-side.

Model manager approvals with thresholds and reason codes; approver permission is checked server-side, not a client checkbox. Approval binds to the specific amount, invoice version and action and cannot be reused after edits. Audit actor, approver, reason, time, correlation ID and safe before/after financial values. Business users cannot edit/delete audit entries. Be explicit that ordinary application append-only controls alone do not make storage tamper-proof against database administrators.

### Architecture boundary
Prefer a modular monolith: existing Next API → finance services → MongoDB repositories, with an optional asynchronous integration worker. Verify MongoDB transaction support and deployment topology before relying on cross-document transactions. If absent, provide a deliberate supported plan; never silently fall back to partial writes.

Proposed conceptual entities: invoices/lines, payments/allocations, credit notes/refunds, register sessions/cash movements, adjustment approvals, audit events and an integration outbox. Reuse equivalent existing collections. Document indexes, tenant scope, schema versions and migration needs. Do not automatically add all proposed collections.

Persist critical writes and outbox events atomically where required. SSE and in-memory event emitters are notifications, not durable accounting queues. Use idempotency keys with request hashes: same key/same payload returns the same outcome; same key/different payload is rejected. UI disabling is supplementary only.

## Phase 0 — Current-repository audit; documentation only
Inspect current routes, imports, data models, API authorization, invoice calculation/printing, payments, discounts, tax setup, settlements, reports, stock events, table release and PWA/offline behavior. Trace one order through bill, receipt, payment, report and inventory with actual symbols. Verify existing scripts; capture baseline failures instead of disguising them.

Capture updated UI/screenshots if runnable and list shared finance components/tokens. Check previous clues: dashboard order-value aggregation, missing chart fields, menuId joins, duplicate global CSS files, password visibility, obsolete lint scripts and ignored type errors. These are historical leads, not current findings.

Deliver AUDIT, PLAN, STATUS and HANDOFF with implemented/partial/missing/unverified matrix and prioritized risks. No product-code edits. Explicitly distinguish Odoo-style implementation from actual integration. Only ask missing decisions after checking repository configuration: accounting owner, Odoo version/deployment/access if integration is wanted, legal entities/outlets, business date/currency, discount/refund policy, offline requirements and historical migration cutoff. Secrets belong in environment configuration, not chat.

Gate: evidence-backed audit and bounded phase plan; no claims of tested UI or accounting when tools/environment are unavailable.

## Phase 1 — Contracts and secure finance foundation
Define domain/API/permission contracts and actual migration/index plan. Establish finance server guards, validation, exact money utilities, concurrency/idempotency primitives, audit writes and transaction support. Scope auth repairs to finance prerequisites and explicitly documented credential risks.

Design one authoritative invoice issuance path. For future Odoo integration decide whether POS issues the invoice and Odoo records it, or Odoo issues the authoritative invoice. Do not create two independently numbered tax invoices for one sale. Default locally to POS issuance; connector implementation is gated on confirmed ownership.

Gate: calculation edge cases, authorization, cross-outlet access, idempotency conflicts and transaction rollback checks pass. No billing flow is switched over until its contract is tested.

## Phase 2 — Billing and actual payments
Extend existing /bills and verified print components. Implement server-priced draft → issue workflow, immutable snapshots, concurrent numbering, split tender, partial payment, allocation and receipt history. Reprints use the same document and original issued snapshot; no new number or payment side effect.

Reuse the current design for list filters, invoice detail, totals, payment dialog and history. Show due amounts and pending processing truthfully. Verify 80mm and A4 layout with long names, multiple pages, tax breakdown, rounding and reprints. Browser print layout success is not hardware ESC/POS proof.

Gate: double-click/retry/concurrent issuance yields one invoice and one intended payment; persisted totals equal UI/PDF/print totals; partial payment leaves the correct outstanding balance. Test provider-pending versus confirmed payment states if a real provider exists. Do not treat a UPI screenshot/reference as verified settlement.

## Phase 3 — Legitimate discounts, credit notes and refunds
Implement approved pre-issue discounts, reason/threshold checks and tax recalculation. After issuance use linked credit documents, with refunded money recorded separately. Display original, adjustment, current due/customer credit and payment/refund history. Financial correction does not automatically restock prepared food; require an explicit returns/wastage decision and track it separately.

Gate: cover all ₹500/₹300 examples above, unauthorized approvals, edited-after-approval actions, cumulative credit limits, concurrent refunds and provider failure/retry. No owner override may conceal actual receipts.

## Phase 4 — Register sessions and cash reconciliation
Extend settlements: opening float, cash receipts, change handling, cash refunds, paid-in/out, petty cash, bank drops, counted cash, expected cash and variance. Tie movements to register/session/operator/outlet with immutable references. Avoid double-counting expenses as both payment and a separate drawer deduction.

Expected drawer = opening float + cash receipts net of change + other cash-in − cash refunds − authorized cash-out. Define whether bank drops are included in cash-out, and never count them twice. UPI/card are separate tenders. A shortage does not reduce sales. Closed sessions cannot be silently rewritten; later corrections are linked, authorized and auditable. Enforce one active session per configured register where appropriate.

Gate: reconcile synthetic multi-tender shifts, midnight cutoff, overlapping closes, concurrent final receipt versus close and shortage/overage. Explicitly test outstanding invoices and room charges.

## Phase 5 — Receivables, expenses and supplier bills
Reuse debtors/customers/suppliers/purchases. Add receivable ageing, payment terms, customer statement, vendor bill/credit/payment allocations, due dates, attachments and expense approval where missing. Do not treat purchase orders or GRNs as paid vendor invoices. Sanitize attachment access and prevent cross-outlet leakage.

Gate: outstanding and ageing reconcile to allocations/credit notes on the same as-of basis; duplicate vendor bill warnings and duplicate-payment protection work. Reminder drafts may be prepared; actual outbound reminders require explicit enablement.

## Phase 6 — Finance reports and accountant export
Implement gross sales, discounts, net sales before tax, tax, billed total, collections by tender, refunds, receivables, customer credits, expenses and cash variance with documented definitions. Separate invoice date, payment date, refund date and business date filters. Use server aggregates, not sums of one paginated page. Keep totals consistent across screen, export and summary.

Provide drill-down to source transactions and auditable adjustments, plus date/outlet/cashier filters. Distinguish unavailable data from zero. Offer accountant-ready CSV/XLSX with stable IDs and protect against spreadsheet formula injection. Full P&L/balance sheet claims require a real balanced ledger, opening balances and posting rules; otherwise label operating summaries accurately. Do not build a second full general ledger by default if Odoo will own accounting.

Gate: reconcile fixed fixtures across reports, invoices, cash movements and exports; verify time boundaries, refunds in later periods and tenant permissions.

## Phase 7 — OPTIONAL actual Odoo connector
Run only when a real target, sandbox access, ownership and version/deployment capability are established. Otherwise mark BLOCKED/NOT REQUESTED while leaving completed local finance functional. Verify official documentation for the target version and installed modules; never guess model fields or assume every hosting plan supports the same API.

Odoo 19 documentation describes JSON-2; confirm applicability to the actual target. Use server-side dedicated least-privilege integration credentials. No secrets in browser bundles/logs. Map company/outlet, partner, product, taxes, accounts/journals, payments and external IDs explicitly.

Default direction: POS sends operational invoice/payment/credit events; Odoo owns accounting journal/reporting state if selected. Avoid uncontrolled bidirectional edits. Record conflict rules and manual reconciliation behavior. Do not count both an Odoo POS sale and a separately imported invoice as two revenues.

Use a durable outbox worker, stable external references, retry/backoff, leases, failure dashboard, manual replay and reconciliation. Local transaction and remote Odoo call are not one atomic transaction. Remote API calls may commit independently; implement a recovery state machine. If remote create succeeds but the response is lost, reconcile by stable identity before retrying. A search-before-create without remote uniqueness/atomicity is not sufficient for concurrent deduplication; use a supported remote constraint/method or documented reconciliation gate.

POS should continue during Odoo outages only under the agreed issuance ownership; if Odoo must issue the final document, display pending issuance rather than inventing its invoice number. Prevent offline service-worker replay from duplicating payments/invoices. Disable unsupported offline financial mutations explicitly.

Gate: sandbox evidence for invoice/payment/credit synchronization, timeout-after-commit recovery, duplicate event, out-of-order event, bad mapping, token expiry and remote outage. Check both systems' record counts and totals. Never label mocked integration as connected.

## Phase 8 — Migration, regression and release readiness
Inventory legacy invoice/payment shapes. Provide dry-run migration, backups, schema versioning, provenance, resumability, reconciliation counts/totals and rollback/runbook. Do not fabricate historical payments or approvals when evidence is absent; classify unresolved balances. Do not reissue or renumber historical bills. Define cutoff and opening balances; avoid double importing historical Odoo records.

Run meaningful unit/integration/end-to-end checks for money, permissions, concurrency, retries and lifecycle transitions. Regression check POS order entry, kitchen events, QR menu, table occupancy, stock depletion exactly once, customer access, login/logout, billing prints and updated dashboard design. Check desktop/tablet/mobile, light/dark, keyboard dialogs, focus and reduced motion. Record exact commands/results and skipped/environment-blocked tests.

Produce a staged rollout/feature-flag plan, rollback limitations once financial records exist, reconciliation dashboard and operational alerts. Complete all local/staging checks before seeking production execution authorization. Do not claim production-ready until unresolved release gates are closed.

## Required phase-end response
1. Phase and completed bounded outcomes.
2. Evidence and changed files with reasons.
3. Exact checks actually executed and results.
4. Financial invariants verified and reconciled examples.
5. UI/regression impact and screenshots when available.
6. Blockers, assumptions and residual risks.
7. STATUS/HANDOFF updates and the exact next phase command.

Begin now with Phase 0 only. Do not implement product code before the audit.

# MASTER PROMPT — END

## Continuation command
Read docs/finance-upgrade/MASTER.md, STATUS.md, HANDOFF.md and relevant DECISIONS.md entries. Verify the current working tree. Execute Phase N only from the approved plan, preserve my current design and unrelated edits, run that phase's checks, update context files and stop with evidence. Do not restart completed work.

## Recovery command if Antigravity forgets context
Stop expanding scope. Read MASTER.md, STATUS.md, HANDOFF.md and CONTRACTS.md. Compare your current diff with the named phase. List unsupported assumptions, invented fields and changes outside scope. Correct only your own phase changes, preserve my work, and resume the first incomplete verified task. Never invent a passing test or restore an older UI.

## Official reference sources
These support the Odoo workflow distinction; verify the actual installed version before implementing.
- Accounting/invoicing: https://www.odoo.com/documentation/19.0/applications/finance/accounting.html
- Customer invoices: https://www.odoo.com/documentation/19.0/applications/finance/accounting/customer_invoices/overview.html
- Credit notes/refunds: https://www.odoo.com/documentation/19.0/applications/finance/accounting/customer_invoices/credit_notes.html
- External API, target-specific fields, access and transaction boundaries: https://www.odoo.com/documentation/19.0/developer/reference/external_api.html
