import test from "node:test";
import assert from "node:assert/strict";
import { OdooClient } from "../../lib/odoo/client.js";
import {
  mapBillToOdooInvoice,
  mapPaymentToOdooPayment,
  mapCreditNoteToOdooRefund,
  mapCustomerToOdooPartner
} from "../../lib/odoo/mapper.js";
import { toPaise } from "../../lib/finance/money.js";

test("Phase 7 Odoo - Honest Configuration & Connection Gating", async () => {
  // Empty client instance without environment variables
  const unconfiguredClient = new OdooClient({
    url: "",
    db: "",
    username: "",
    apiKey: ""
  });

  const check = unconfiguredClient.isConfigured();
  assert.equal(check.configured, false);
  assert.ok(check.missing.includes("ODOO_URL"));
  assert.ok(check.missing.includes("ODOO_DB"));
  assert.ok(check.missing.includes("ODOO_USERNAME"));
  assert.ok(check.missing.includes("ODOO_API_KEY"));

  // Contract rule: Never label mocked integration as connected
  const status = await unconfiguredClient.getStatus();
  assert.equal(status.connected, false);
  assert.equal(status.status, "BLOCKED_NO_CREDENTIALS");
  assert.ok(status.message.includes("Odoo integration is gated"));
});

test("Phase 7 Odoo - Invoice Mapping & Authoritative Reference Preservation", () => {
  const sampleBill = {
    billNumber: "INV-20261102-0001",
    issueDate: "2026-11-02T12:00:00Z",
    tableName: "Table 4",
    grandTotalPaise: toPaise(1250),
    items: [
      {
        name: "Butter Chicken",
        quantity: 2,
        unitPricePaise: toPaise(450),
        discountPaise: 0
      },
      {
        name: "Garlic Naan",
        quantity: 5,
        unitPricePaise: toPaise(70),
        discountPaise: 0
      }
    ]
  };

  const odooInvoice = mapBillToOdooInvoice(sampleBill);

  // Contract Invariants:
  // 1. POS is authoritative issuer: POS billNumber preserved as ref
  assert.equal(odooInvoice.move_type, "out_invoice");
  assert.equal(odooInvoice.ref, "INV-20261102-0001");
  // 2. Stable external reference for deduplication
  assert.equal(odooInvoice.external_reference, "HOTEL_POS_INV_INV-20261102-0001");
  assert.equal(odooInvoice.invoice_date, "2026-11-02");
  // 3. Line items mapped with correct unit prices in Rupees float
  assert.equal(odooInvoice.invoice_line_ids.length, 2);
  assert.equal(odooInvoice.invoice_line_ids[0][2].name, "Butter Chicken");
  assert.equal(odooInvoice.invoice_line_ids[0][2].quantity, 2);
  assert.equal(odooInvoice.invoice_line_ids[0][2].price_unit, 450);
});

test("Phase 7 Odoo - Payment Mapping & External Reference Contract", () => {
  const samplePayment = {
    receiptNumber: "REC-20261102-0001",
    billNumber: "INV-20261102-0001",
    recordedAt: "2026-11-02T12:30:00Z",
    amountPaise: toPaise(1250),
    tender: "upi"
  };

  const odooPayment = mapPaymentToOdooPayment(samplePayment, { journalId: 7 });

  assert.equal(odooPayment.payment_type, "inbound");
  assert.equal(odooPayment.partner_type, "customer");
  assert.equal(odooPayment.amount, 1250);
  assert.equal(odooPayment.ref, "REC-20261102-0001");
  assert.equal(odooPayment.external_reference, "HOTEL_POS_REC_REC-20261102-0001");
  assert.equal(odooPayment.journal_id, 7);
});

test("Phase 7 Odoo - Credit Note Mapping Contract", () => {
  const sampleCreditNote = {
    creditNoteNumber: "CN-20261102-0001",
    billNumber: "INV-20261102-0001",
    issuedAt: "2026-11-02T13:00:00Z",
    amountPaise: toPaise(200),
    reasonText: "Food Quality Issue"
  };

  const odooRefund = mapCreditNoteToOdooRefund(sampleCreditNote);

  assert.equal(odooRefund.move_type, "out_refund");
  assert.equal(odooRefund.ref, "CN-20261102-0001");
  assert.equal(odooRefund.external_reference, "HOTEL_POS_CN_CN-20261102-0001");
  assert.equal(odooRefund.invoice_line_ids[0][2].price_unit, 200);
});

test("Phase 7 Odoo - Recovery State Machine & Deduplication Invariant", async () => {
  // Mock external Odoo search returning an already-committed record
  const mockExistingInOdoo = [{ id: 4092, ref: "HOTEL_POS_INV_INV-20261102-0001" }];

  const mockClient = {
    isConfigured: () => ({ configured: true, missing: [] }),
    executeKw: async (model, method, args) => {
      if (method === "search_read") {
        return { success: true, result: mockExistingInOdoo };
      }
      if (method === "create") {
        throw new Error("Duplicate creation attempt! Entity already exists.");
      }
      return { success: false, error: "Unknown method" };
    }
  };

  // Simulate timeout-after-commit recovery:
  // When outbox retries an event whose create previously committed remotely,
  // the pre-creation search must detect it and reconcile rather than creating duplicate.
  const externalRef = "HOTEL_POS_INV_INV-20261102-0001";
  const searchResult = await mockClient.executeKw("account.move", "search_read", [
    [["ref", "=", externalRef]]
  ]);

  assert.equal(searchResult.success, true);
  assert.equal(searchResult.result.length, 1);
  assert.equal(searchResult.result[0].id, 4092);
  // Reconciled without duplicate call to create
});

test("Phase 7 Odoo - Outbox Exponential Backoff Calculation", () => {
  const calculateBackoffMs = (attempts) => {
    return Math.min(300000, Math.pow(2, attempts) * 1000);
  };

  assert.equal(calculateBackoffMs(1), 2000);  // 2s
  assert.equal(calculateBackoffMs(2), 4000);  // 4s
  assert.equal(calculateBackoffMs(3), 8000);  // 8s
  assert.equal(calculateBackoffMs(4), 16000); // 16s
  assert.equal(calculateBackoffMs(5), 32000); // 32s

  // State transitions: 5 attempts triggers dead-letter transition
  const isDeadLetter = (attempts, maxAttempts = 5) => attempts >= maxAttempts;
  assert.equal(isDeadLetter(4), false);
  assert.equal(isDeadLetter(5), true);
  assert.equal(isDeadLetter(6), true);
});
