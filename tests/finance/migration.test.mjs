import test from "node:test";
import assert from "node:assert/strict";
import { transformLegacyBillToSchemaV2 } from "../../scripts/migrate-finance.mjs";
import { toPaise } from "../../lib/finance/money.js";

test("Phase 8 Migration - Non-Destructive Legacy Bill Transformation", () => {
  const legacyBill = {
    _id: "mongo-id-legacy-001",
    billNumber: "LEGACY-INV-0042", // Must NOT be altered or renumbered
    subtotal: 1500.50,
    discount: 100.50,
    tax: 70.00,
    totalAmount: 1470.00,
    status: "paid",
    customerName: "Siddharth Verma",
    tableName: "Table 8",
    createdAt: new Date("2025-08-15T18:30:00Z")
  };

  const updates = transformLegacyBillToSchemaV2(legacyBill, "BATCH-TEST-001");

  assert.ok(updates, "Transformation updates must be produced");
  assert.equal(updates.schemaVersion, 2);

  // Exact integer paise conversion
  assert.equal(updates.grossSubtotalPaise, 150050); // ₹1,500.50
  assert.equal(updates.totalDiscountPaise, 10050);   // ₹100.50
  assert.equal(updates.taxableAmountPaise, 140000);  // ₹1,400.00
  assert.equal(updates.totalTaxPaise, 7000);         // ₹70.00
  assert.equal(updates.grandTotalPaise, 147000);     // ₹1,470.00
  assert.equal(updates.paidAmountPaise, 147000);     // Fully paid
  assert.equal(updates.balanceDuePaise, 0);
  assert.equal(updates.status, "paid");

  // Dual GST breakdown
  assert.equal(updates.taxBreakdown.cgstPaise, 3500); // 50% of ₹70 = ₹35
  assert.equal(updates.taxBreakdown.sgstPaise, 3500);

  // Provenance tracking
  assert.equal(updates.provenance.migratedFromSchema, 1);
  assert.equal(updates.provenance.migrationBatch, "BATCH-TEST-001");
  assert.ok(updates.provenance.migratedAt instanceof Date);

  // Verify historical document authority: billNumber is never altered
  assert.equal(legacyBill.billNumber, "LEGACY-INV-0042");
});

test("Phase 8 Migration - Idempotency & Resumability Guard", () => {
  // A bill that is already migrated (schemaVersion >= 2)
  const alreadyMigratedBill = {
    _id: "mongo-id-v2-001",
    billNumber: "INV-20261102-0001",
    schemaVersion: 2,
    grossSubtotalPaise: 100000,
    grandTotalPaise: 105000,
    status: "paid"
  };

  const result = transformLegacyBillToSchemaV2(alreadyMigratedBill, "BATCH-TEST-002");
  assert.equal(result, null, "Already migrated bills must be safely skipped");
});

test("Phase 8 Migration - Truthful Status & Unresolved Balance Classification", () => {
  // Scenario 1: Unpaid legacy bill
  const unpaidLegacyBill = {
    _id: "legacy-unpaid",
    billNumber: "LEGACY-INV-0099",
    totalAmount: 2500,
    status: "unpaid"
  };
  const unpaidResult = transformLegacyBillToSchemaV2(unpaidLegacyBill, "BATCH-TEST-003");
  assert.equal(unpaidResult.status, "unpaid");
  assert.equal(unpaidResult.paidAmountPaise, 0);
  assert.equal(unpaidResult.balanceDuePaise, 250000);

  // Scenario 2: Partially paid legacy bill
  const partialLegacyBill = {
    _id: "legacy-partial",
    billNumber: "LEGACY-INV-0100",
    totalAmount: 3000,
    paidAmount: 1000,
    status: "partially_paid"
  };
  const partialResult = transformLegacyBillToSchemaV2(partialLegacyBill, "BATCH-TEST-003");
  assert.equal(partialResult.status, "partially_paid");
  assert.equal(partialResult.paidAmountPaise, 100000);
  assert.equal(partialResult.balanceDuePaise, 200000);

  // Scenario 3: Cancelled legacy bill
  const cancelledLegacyBill = {
    _id: "legacy-cancelled",
    billNumber: "LEGACY-INV-0101",
    totalAmount: 1500,
    status: "cancelled"
  };
  const cancelledResult = transformLegacyBillToSchemaV2(cancelledLegacyBill, "BATCH-TEST-003");
  assert.equal(cancelledResult.status, "cancelled");
  assert.equal(cancelledResult.balanceDuePaise, 0);
});
