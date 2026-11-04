# Test Verification, Commands & Invariants Protocol

**Document:** `docs/finance-upgrade/TESTS.md`  
**Date:** 2 November 2026  
**Status:** All 8 Phases Verified & Production Ready ✅

---

## 1. Test Suite Execution (`npm run test:finance`)

The automated finance test suite was executed across all 10 test files with 100% pass rate:

```
> my-v0-project@0.1.0 test:finance
> node --test tests/finance/*.test.mjs

✔ Phase 2 Billing - Invoice Issuance Snapshot & Invariants (1.14ms)
✔ Phase 2 Payments - Partial Payment & Balance Tracking (0.14ms)
✔ Phase 2 Payments - Split Tender Allocation (Cash + UPI + Card) (0.10ms)
✔ Phase 2 Payments - Over-Payment Prevention Guard (0.21ms)
✔ Phase 2 Payments - Cash Change Calculation Integrity (0.08ms)
✔ Phase 2 Formatting - Identifier Sequence Number Contract (0.09ms)
✔ Phase 3 Discounts - Cashier Threshold & Manager Authorization Rules (1.04ms)
✔ Phase 3 Discounts - Pre-Issue Discount Tax Recalculation (Canonical Scenario A) (0.28ms)
✔ Phase 3 Credit Notes - Cumulative Credit Limit Enforcement (0.29ms)
✔ Phase 3 Refunds - Cumulative Refund Limit Enforcement (0.11ms)
✔ Phase 3 Invariants - Scenario C: Post-Issue Credit Note & Actual Refund (1.57ms)
✔ Phase 3 Inventory - Food Wastage vs Packaged Restock Contract (0.10ms)
✔ Phase 3 Formatting - Credit Note & Refund Sequence Contract (0.08ms)
✔ Financial Invariant - Scenario A: Pre-Issue Approved Discount (1.77ms)
✔ Financial Invariant - Scenario B: Partial Payment Handling (0.17ms)
✔ Financial Invariant - Scenario C: Post-Issue Credit Note & Actual Refund (0.15ms)
✔ Financial Invariant - Scenario D: Cash Drawer Shortage (0.14ms)
✔ Phase 8 Migration - Non-Destructive Legacy Bill Transformation (1.53ms)
✔ Phase 8 Migration - Idempotency & Resumability Guard (0.07ms)
✔ Phase 8 Migration - Truthful Status & Unresolved Balance Classification (0.09ms)
✔ Money Engine - toPaise conversion (1.07ms)
✔ Money Engine - formatINR display (0.11ms)
✔ Money Engine - Residue-Free Split Distribution (1.05ms)
✔ Money Engine - Tax Calculation (Basis Points) (0.07ms)
✔ Money Engine - Line Item Calculation with Discount & Dual GST (0.37ms)
✔ Money Engine - Complete Invoice Calculation Snapshot (0.40ms)
✔ Phase 7 Odoo - Honest Configuration & Connection Gating (1.02ms)
✔ Phase 7 Odoo - Invoice Mapping & Authoritative Reference Preservation (1.85ms)
✔ Phase 7 Odoo - Payment Mapping & External Reference Contract (0.14ms)
✔ Phase 7 Odoo - Credit Note Mapping Contract (0.11ms)
✔ Phase 7 Odoo - Recovery State Machine & Deduplication Invariant (0.10ms)
✔ Phase 7 Odoo - Outbox Exponential Backoff Calculation (0.96ms)
✔ Phase 5 Receivables - Ageing Buckets Conservation Invariant (6.22ms)
✔ Phase 5 Receivables - Customer Statement of Account Invariant (0.32ms)
✔ Phase 5 Purchases - Duplicate Vendor Bill Detection Contract (0.09ms)
✔ Phase 5 Purchases - PO/GRN vs Paid Vendor Bill Contract (0.07ms)
✔ Phase 5 Expenses - Cash Drawer Linkage Contract (No Double-Counting) (0.13ms)
✔ Phase 5 Receivables - Payment Allocation and Overpayment Guard (1.08ms)
✔ Phase 6 Reports - Authoritative Aggregation & Financial Invariants (2.67ms)
✔ Phase 6 Exports - Spreadsheet Formula Injection (CSV Injection) Mitigation (0.19ms)
✔ Phase 6 Exports - Financial Summary CSV Integrity (0.97ms)
✔ Phase 6 Exports - Invoices & Collections CSV Exporter (0.49ms)
✔ Phase 6 Reports - Zero Reliance on Unbilled Orders Gate (0.08ms)
✔ Security Engine - Hash Generation & scrypt Verification (98.77ms)
✔ Security Engine - Legacy Plaintext Verification & Auto-Upgrade Flag (0.10ms)
✔ Security Engine - Credential Sanitization (Zero Password Leaks) (0.12ms)
✔ Phase 4 Sessions - Expected Drawer Formula & Multi-Movement Reconciliation (0.92ms)
✔ Phase 4 Sessions - Denomination Counter Calculation (0.38ms)
✔ Phase 4 Invariants - Scenario D: Cash Drawer Shortage Reconciled (0.10ms)
✔ Phase 4 Sessions - Cash Drawer Overage (0.07ms)
✔ Phase 4 Sessions - One Active Session Per Register Rule (0.25ms)
✔ Phase 4 Formatting - Session & Cash Movement Sequences (0.12ms)

ℹ tests 52
ℹ suites 0
ℹ pass 52
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 343.05ms
```

---

## 2. Invariants Covered in Test Suite

1. **Scenario A (Pre-Issue Discount):** Gross subtotal minus line discount equals net taxable amount; taxes recomputed precisely on discounted base.
2. **Scenario B (Partial Payment):** Balance due strictly equals total invoice amount minus sum of allocated payments.
3. **Scenario C (Post-Issue Credit Note & Refund):** Original invoice remains intact at original grand total; net retained revenue and net retained cash audited via linked credit note and refund records.
4. **Scenario D (Cash Drawer Shortage):** Register session expected cash formula accounts for float, sales, refunds, cash-in, and petty cash-out. Physical shortage audited as operational variance without altering sales.
5. **Phase 5 Receivables Ageing Conservation Invariant:** $\text{Current} + \text{Days31\_60} + \text{Days61\_90} + \text{Days90Plus} \equiv \text{TotalOutstandingPaise}$.
6. **Customer Statement of Account Reconciliation:** $\text{ClosingBalance} \equiv \text{OpeningBalance} + \sum\text{Debits} - \sum\text{Credits}$.
7. **Phase 6 Revenue Reconciliation Invariant:** $\text{Gross Sales} - \text{Discounts} \equiv \text{Net Taxable Turnover}$.
8. **Phase 6 Invoiced Total Invariant:** $\text{Net Sales} + \text{Taxes} \equiv \text{Billed Total}$.
9. **Phase 6 Realized Collections Invariant:** $\text{Gross Collections} - \text{Refunds} \equiv \text{Net Collections Realized}$.
10. **Phase 6 Zero Reliance on Unbilled Orders:** Orders pending in kitchen or unbilled are strictly excluded from financial revenue.
11. **Phase 6 Spreadsheet Formula Injection Protection:** Cells starting with `=`, `+`, `-`, `@`, `\t`, `\r` are sanitized with single quotes to prevent execution in Excel/Google Sheets.
12. **Phase 7 Honest Connection Gating:** Never marks integration as connected when credentials/sandbox are absent; returns `BLOCKED_NO_CREDENTIALS`.
13. **Phase 7 Document Authority & External References:** POS retains document numbering authority (`ref: billNumber`); stable external reference prevents duplicate insertion.
14. **Phase 7 Timeout-After-Commit Recovery:** Outbox verifies external reference before retrying create, reconciling cleanly without creating duplicates.
15. **Phase 7 Exponential Backoff & Dead-Letter Queue:** Exponential delay (1s, 2s, 4s, 8s, 16s) with transition to dead letter on 5th failure.
16. **Phase 8 Non-Destructive Migration Transformation:** Upgrades legacy records to Schema V2 without altering bill numbers, dates, or customer records.
17. **Phase 8 Migration Idempotency & Resumability:** Already-upgraded bills (`schemaVersion: 2`) are safely skipped.
18. **Phase 8 Truthful Payment Status Classification:** Does not fabricate receipts without historical evidence.

---

## 3. Production Build Validation

`npm run build` completed cleanly across all **94 Next.js application routes** with 0 errors:
- `94/94` static and dynamic routes compiled.
- Zero JSX, syntax, or typing errors.
