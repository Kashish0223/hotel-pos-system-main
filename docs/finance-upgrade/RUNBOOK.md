# Enterprise Finance Upgrade - Operational Release Runbook

**Document Location:** `docs/finance-upgrade/RUNBOOK.md`  
**Evaluation Timestamp:** 2 November 2026  
**Status:** Release Ready ✅

---

## 1. Pre-Deployment Verification Checklist

Before deploying the finance upgrade to staging or production, execute and verify all prerequisites:

- [x] **Zero Plaintext Passwords:** All staff passwords hashed with native `scrypt`; `{ password: 0 }` projection on all staff queries.
- [x] **Integer Minor Units:** All monetary calculations use integer paise (₹1.00 = 100 paise) via `lib/finance/money.js`.
- [x] **Authoritative Billing:** Atomic sequence numbers (`INV-YYYYMMDD-XXXXXXX`); duplicate order billing prevention (`409 Conflict`).
- [x] **Atomic Split Payments:** Split tender allocation (Cash, UPI, Card) with change return calculation and atomic receipts (`REC-YYYYMMDD-XXXXXXX`).
- [x] **Credit Notes & Refunds:** Legitimate post-issue corrections with cumulative credit limit enforcement (`CN-YYYYMMDD-XXXXXXX`) and refunds (`REF-YYYYMMDD-XXXXXXX`).
- [x] **Register Sessions & Cash Drawer:** Authoritative Expected Drawer formula with denomination calculator and audited shift variance (`SES-YYYYMMDD-XXXXXXX`).
- [x] **Receivables & Ageing:** Real-time ageing buckets (Current, 31–60d, 61–90d, 90+d) and customer statements of account.
- [x] **Authoritative Reports:** Server-side aggregation with formula injection (CSV injection) protection.
- [x] **Odoo ERP Outbox Connector:** Durable transactional outbox with recovery state machine and honest connection gating.
- [x] **Design Preservation:** Ambrel restaurant dashboard remains 100% intact, untouched, and functional.

---

## 2. Database Backup & Safeguards

Always capture a point-in-time snapshot of the database prior to executing migrations or releases:

```bash
# 1. Take a full snapshot of the MongoDB database
mongodump --uri="mongodb://localhost:27017/hotel_pos" --out="/backups/hotel_pos_pre_finance_$(date +%Y%m%d_%H%M%S)"

# 2. Verify backup archive integrity
ls -lh /backups/hotel_pos_pre_finance_*
```

---

## 3. Historical Data Migration Procedure

The migration script (`scripts/migrate-finance.mjs`) is strictly **non-destructive**, **idempotent**, and **resumable**. It never alters historical invoice numbers or invents false payment records.

### Step 1: Run Dry-Run Analysis
Execute the migration script in dry-run mode (read-only):

```bash
node scripts/migrate-finance.mjs
```

**Expected Dry-Run Output:**
```
========================================================
HOTEL POS - HISTORICAL FINANCE MIGRATION RUNNER
Mode:     DRY RUN (Analysis only, no writes)
Batch ID: MIG-20261102154500
Database: hotel_pos
========================================================

Scanning bills collection...
Found N legacy bills requiring Schema V2 upgrade.

----------------- RECONCILIATION SUMMARY -----------------
Bills Processed:      N
Total Billed Revenue: ₹X,XXX.XX (XXXXX paise)
Total Historical Paid:₹Y,YYY.YY (YYYYY paise)
Total Balance Due:    ₹Z,ZZZ.ZZ (ZZZZZ paise)
----------------------------------------------------------

DRY RUN COMPLETE. Zero database writes were executed.
```

### Step 2: Execute Live Migration
Apply the Schema V2 upgrade:

```bash
node scripts/migrate-finance.mjs --live
```

---

## 4. Rollback Limitations & Accounting Realities

> [!WARNING]
> **Strict Financial Accounting Rule:**
> In enterprise accounting, once authoritative financial records (bills, receipts, credit notes, drawer sessions) are issued, they **cannot be rolled back by deleting records**. Deleting financial records creates audit gaps and legal compliance violations.

1. **Bill Corrections:**
   If an invoice was issued incorrectly, do **not** delete the invoice. Issue an authorized **Credit Note** (`CN-YYYYMMDD-XXXXXXX`) for the erroneous amount with appropriate reason code.
2. **Payment Errors:**
   If an incorrect payment was recorded, issue a formal **Refund** (`REF-YYYYMMDD-XXXXXXX`) linked to an approved credit note.
3. **Drawer Discrepancies:**
   If physical cash differs from expected drawer cash, enter the exact counted denominations and record a detailed explanation in the shift close note. The discrepancy is audited as a cash variance, never by editing past sales.
4. **Code Rollback:**
   If a code rollback to an earlier git commit is necessary, the database Schema V2 fields (`grossSubtotalPaise`, `grandTotalPaise`, etc.) are backward-compatible and will not break legacy code reading `totalAmount`.

---

## 5. Operational Monitoring & Alerts

| Alert Event | Condition | Recommended Action |
|---|---|---|
| **Excessive Cash Variance** | Drawer shortage/overage $> ₹500$ on shift close | Manager must review shift cash movements and denomination count before signing off. |
| **High Value Pre-Issue Discount** | Cashier applies discount $> 10\%$ or $> ₹200$ | Automatically requires manager PIN authorization. |
| **Outbox Dead-Letter Event** | Event fails Odoo sync after 5 attempts | Review error in `/api/finance/odoo`, fix underlying issue, and trigger manual replay. |
| **Duplicate Bill Submission** | Vendor bill re-entered with same bill number | System automatically rejects with `409 Conflict`. |

---

## 6. End-to-End Test Execution

To execute the entire 52+ automated finance test suite:

```bash
npm run test:finance
```

To validate production build compilation across all routes:

```bash
npm run build
```
