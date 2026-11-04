/**
 * Exact Money & Tax Calculations Engine (Integer Minor Units / INR Paise)
 * 
 * Rules:
 * - 1 INR = 100 paise.
 * - All internal arithmetic uses integer paise.
 * - Rounding is standard Half-Up: Math.round(value + 1e-9).
 * - Residue paise on split bills are allocated deterministically to ensure sum(shares) === total.
 */

/**
 * Convert INR rupees (number or numeric string) to integer paise.
 * @param {number|string} rupees 
 * @returns {number} Integer paise
 */
export function toPaise(rupees) {
  if (rupees === null || rupees === undefined || rupees === "") {
    return 0;
  }
  const num = typeof rupees === "string" ? parseFloat(rupees) : rupees;
  if (isNaN(num)) {
    throw new TypeError(`Invalid monetary value: "${rupees}"`);
  }
  return Math.round((num + 1e-9) * 100);
}

/**
 * Convert integer paise to decimal rupees formatted string.
 * @param {number} paise 
 * @param {boolean} includeSymbol - If true, prefixes "₹"
 * @returns {string} e.g. "120.50" or "₹120.50"
 */
export function formatINR(paise, includeSymbol = false) {
  const p = Math.round(paise || 0);
  const rupees = (p / 100).toFixed(2);
  return includeSymbol ? `₹${rupees}` : rupees;
}

/**
 * Convert integer paise to float rupees for UI calculations where necessary.
 * @param {number} paise 
 * @returns {number}
 */
export function toRupees(paise) {
  return Math.round(paise || 0) / 100;
}

/**
 * Standard half-up integer rounding.
 * @param {number} val 
 * @returns {number}
 */
export function roundHalfUp(val) {
  return Math.round(val + 1e-9);
}

/**
 * Distribute a total amount of paise across N payers without losing or creating a single paisa.
 * Remainder paise are allocated to the first (total % count) payers.
 * 
 * @param {number} totalPaise - Total bill in paise
 * @param {number} count - Number of splits
 * @returns {number[]} Array of paise allocations
 */
export function distributePaise(totalPaise, count) {
  if (!Number.isInteger(count) || count <= 0) {
    throw new RangeError("Split count must be an integer greater than 0");
  }
  const total = Math.round(totalPaise || 0);
  const base = Math.floor(total / count);
  const remainder = total % count;

  const shares = [];
  for (let i = 0; i < count; i++) {
    // Distribute remainder 1 paisa to the first `remainder` shares
    shares.push(i < remainder ? base + 1 : base);
  }

  // Self-validating invariant
  const sum = shares.reduce((a, b) => a + b, 0);
  if (sum !== total) {
    throw new Error(`Residue distribution invariant failed: sum ${sum} !== total ${total}`);
  }

  return shares;
}

/**
 * Calculate tax for an amount in paise given basis points (1% = 100 bps).
 * Example: 2.5% CGST = 250 bps.
 * 
 * @param {number} amountPaise 
 * @param {number} rateBps - Rate in basis points (e.g. 250 = 2.5%, 500 = 5%)
 * @returns {number} Tax in integer paise
 */
export function calculateTaxPaise(amountPaise, rateBps) {
  if (!amountPaise || !rateBps) return 0;
  return roundHalfUp((amountPaise * rateBps) / 10000);
}

/**
 * Standard line-item calculation for restaurant POS items.
 * 
 * @param {Object} item
 * @param {string} item.name
 * @param {number} item.unitPricePaise
 * @param {number} item.quantity
 * @param {number} [item.discountPaise=0]
 * @param {Array<{name: string, rateBps: number}>} [item.taxRules=[]]
 * @returns {Object} Calculated line item snapshot
 */
export function calculateLineItem(item) {
  const qty = Number(item.quantity) || 1;
  const unitPricePaise = Math.round(item.unitPricePaise || 0);
  const grossPaise = unitPricePaise * qty;
  const discountPaise = Math.min(grossPaise, Math.round(item.discountPaise || 0));
  const netPaise = grossPaise - discountPaise;

  const taxRules = Array.isArray(item.taxRules) ? item.taxRules : [];
  let lineTaxTotalPaise = 0;

  const taxes = taxRules.map(rule => {
    const taxAmountPaise = calculateTaxPaise(netPaise, rule.rateBps || 0);
    lineTaxTotalPaise += taxAmountPaise;
    return {
      name: rule.name,
      rateBps: rule.rateBps,
      ratePct: (rule.rateBps / 100).toFixed(2),
      amountPaise: taxAmountPaise
    };
  });

  const totalPaise = netPaise + lineTaxTotalPaise;

  return {
    itemId: item.itemId || item._id,
    name: item.name || "Item",
    quantity: qty,
    unitPricePaise,
    grossPaise,
    discountPaise,
    netPaise,
    taxes,
    lineTaxTotalPaise,
    totalPaise
  };
}

/**
 * Calculate entire invoice totals from calculated line items and invoice-level adjustments.
 * 
 * @param {Object} params
 * @param {Array} params.lines - Raw item list or pre-calculated lines
 * @param {number} [params.orderDiscountPaise=0] - Additional pre-tax bill-level discount
 * @param {number} [params.serviceChargeBps=0] - Service charge in basis points
 * @param {number} [params.tipPaise=0] - Voluntary guest tip
 * @returns {Object} Authoritative invoice calculation snapshot
 */
export function calculateInvoiceTotals({
  lines = [],
  orderDiscountPaise = 0,
  serviceChargeBps = 0,
  tipPaise = 0
}) {
  const calculatedLines = lines.map(calculateLineItem);

  let grossSubtotalPaise = 0;
  let lineDiscountTotalPaise = 0;
  let netSubtotalPaise = 0;
  let taxTotalPaise = 0;

  // Aggregate line amounts
  calculatedLines.forEach(line => {
    grossSubtotalPaise += line.grossPaise;
    lineDiscountTotalPaise += line.discountPaise;
    netSubtotalPaise += line.netPaise;
    taxTotalPaise += line.lineTaxTotalPaise;
  });

  // Apply invoice-level discount (capped to net subtotal)
  const additionalDiscountPaise = Math.min(netSubtotalPaise, Math.max(0, Math.round(orderDiscountPaise || 0)));
  const totalDiscountPaise = lineDiscountTotalPaise + additionalDiscountPaise;
  const taxableSubtotalPaise = netSubtotalPaise - additionalDiscountPaise;

  // Recalculate invoice taxes if additional invoice discount was applied
  let finalTaxPaise = taxTotalPaise;
  if (additionalDiscountPaise > 0 && netSubtotalPaise > 0) {
    const ratio = taxableSubtotalPaise / netSubtotalPaise;
    finalTaxPaise = roundHalfUp(taxTotalPaise * ratio);
  }

  // Service charge
  const serviceChargePaise = calculateTaxPaise(taxableSubtotalPaise, serviceChargeBps);

  // Tips
  const tipAmountPaise = Math.max(0, Math.round(tipPaise || 0));

  // Grand Total
  const grandTotalPaise = taxableSubtotalPaise + finalTaxPaise + serviceChargePaise + tipAmountPaise;

  // Aggregate tax rules across lines
  const taxMap = new Map();
  calculatedLines.forEach(line => {
    line.taxes.forEach(t => {
      const current = taxMap.get(t.name) || { name: t.name, rateBps: t.rateBps, amountPaise: 0 };
      current.amountPaise += t.amountPaise;
      taxMap.set(t.name, current);
    });
  });

  let taxLines = Array.from(taxMap.values());
  if (additionalDiscountPaise > 0 && netSubtotalPaise > 0) {
    const ratio = taxableSubtotalPaise / netSubtotalPaise;
    taxLines = taxLines.map(t => ({
      ...t,
      amountPaise: roundHalfUp(t.amountPaise * ratio)
    }));
  }

  return {
    lines: calculatedLines,
    grossSubtotalPaise,
    lineDiscountTotalPaise,
    orderDiscountPaise: additionalDiscountPaise,
    totalDiscountPaise,
    netSubtotalPaise,
    taxableSubtotalPaise,
    taxLines,
    taxTotalPaise: finalTaxPaise,
    totalTaxPaise: finalTaxPaise,
    serviceChargePaise,
    tipPaise: tipAmountPaise,
    grandTotalPaise,
    // Display string helpers
    display: {
      grossSubtotal: formatINR(grossSubtotalPaise),
      totalDiscount: formatINR(totalDiscountPaise),
      taxableSubtotal: formatINR(taxableSubtotalPaise),
      taxTotal: formatINR(finalTaxPaise),
      serviceCharge: formatINR(serviceChargePaise),
      tip: formatINR(tipAmountPaise),
      grandTotal: formatINR(grandTotalPaise)
    }
  };
}
