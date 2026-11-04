import test from "node:test";
import assert from "node:assert/strict";
import {
  toPaise,
  toRupees,
  formatINR,
  distributePaise,
  calculateTaxPaise,
  calculateLineItem,
  calculateInvoiceTotals
} from "../../lib/finance/money.js";

test("Money Engine - toPaise conversion", () => {
  assert.equal(toPaise(0), 0);
  assert.equal(toPaise("0"), 0);
  assert.equal(toPaise(100), 10000);
  assert.equal(toPaise("100.50"), 10050);
  assert.equal(toPaise(0.01), 1);
  assert.equal(toPaise("0.99"), 99);
  assert.equal(toPaise(500), 50000);
  assert.throws(() => toPaise("invalid_num"), TypeError);
});

test("Money Engine - formatINR display", () => {
  assert.equal(formatINR(50000), "500.00");
  assert.equal(formatINR(50000, true), "₹500.00");
  assert.equal(formatINR(3333, true), "₹33.33");
  assert.equal(formatINR(0, true), "₹0.00");
});

test("Money Engine - Residue-Free Split Distribution", () => {
  // 10000 paise (₹100) split 3 ways: 3334, 3333, 3333
  const split3 = distributePaise(10000, 3);
  assert.equal(split3.length, 3);
  assert.deepEqual(split3, [3334, 3333, 3333]);
  assert.equal(split3.reduce((a, b) => a + b, 0), 10000);

  // 50000 paise (₹500) split 7 ways: 7143 * 1, 7142 * 6 = 50000
  const split7 = distributePaise(50000, 7);
  assert.equal(split7.length, 7);
  assert.equal(split7.reduce((a, b) => a + b, 0), 50000);

  // 1 paisa split 2 ways: [1, 0]
  const split1 = distributePaise(1, 2);
  assert.deepEqual(split1, [1, 0]);
  assert.equal(split1.reduce((a, b) => a + b, 0), 1);
});

test("Money Engine - Tax Calculation (Basis Points)", () => {
  // 2.5% CGST (250 bps) on ₹100.00 (10000 paise) = 250 paise (₹2.50)
  assert.equal(calculateTaxPaise(10000, 250), 250);

  // 2.5% SGST (250 bps) on ₹500.00 (50000 paise) = 1250 paise (₹12.50)
  assert.equal(calculateTaxPaise(50000, 250), 1250);

  // Half-up rounding check: 2.5% on ₹3.33 (333 paise) = 8.325 -> 8 paise
  assert.equal(calculateTaxPaise(333, 250), 8);
});

test("Money Engine - Line Item Calculation with Discount & Dual GST", () => {
  const line = calculateLineItem({
    name: "Butter Chicken",
    unitPricePaise: 40000, // ₹400
    quantity: 2,           // Total gross = ₹800
    discountPaise: 10000,  // ₹100 discount -> Net = ₹700 (70000 paise)
    taxRules: [
      { name: "CGST", rateBps: 250 }, // 2.5% = ₹17.50 = 1750 paise
      { name: "SGST", rateBps: 250 }  // 2.5% = ₹17.50 = 1750 paise
    ]
  });

  assert.equal(line.grossPaise, 80000);
  assert.equal(line.discountPaise, 10000);
  assert.equal(line.netPaise, 70000);
  assert.equal(line.lineTaxTotalPaise, 3500); // ₹35.00
  assert.equal(line.totalPaise, 73500);       // ₹735.00
});

test("Money Engine - Complete Invoice Calculation Snapshot", () => {
  const invoice = calculateInvoiceTotals({
    lines: [
      {
        name: "Paneer Tikka",
        unitPricePaise: 30000, // ₹300
        quantity: 1,
        taxRules: [
          { name: "CGST", rateBps: 250 },
          { name: "SGST", rateBps: 250 }
        ]
      },
      {
        name: "Garlic Naan",
        unitPricePaise: 5000,  // ₹50
        quantity: 2,           // ₹100
        taxRules: [
          { name: "CGST", rateBps: 250 },
          { name: "SGST", rateBps: 250 }
        ]
      }
    ],
    orderDiscountPaise: 0,
    serviceChargeBps: 0,
    tipPaise: 0
  });

  // Net subtotal: 30000 + 10000 = 40000 paise (₹400.00)
  assert.equal(invoice.grossSubtotalPaise, 40000);
  assert.equal(invoice.taxableSubtotalPaise, 40000);

  // 5% total tax on ₹400 = ₹20.00 = 2000 paise
  assert.equal(invoice.taxTotalPaise, 2000);
  assert.equal(invoice.grandTotalPaise, 42000); // ₹420.00
  assert.equal(invoice.display.grandTotal, "420.00");
});
