/**
 * Odoo Entity Mapper
 * 
 * Maps POS domain records into standard Odoo accounting models:
 * - Invoices -> `account.move` (move_type: "out_invoice")
 * - Payments -> `account.payment` (payment_type: "inbound")
 * - Credit Notes -> `account.move` (move_type: "out_refund")
 * - Customers -> `res.partner`
 * 
 * Authority & Idempotency Rules:
 * 1. POS is the authoritative issuer for all customer invoices.
 * 2. POS bill number is preserved in Odoo as `ref`.
 * 3. Stable external references (`HOTEL_POS_...`) guarantee idempotent deduplication upon retry.
 */

/**
 * Map an authoritative POS bill to an Odoo Customer Invoice (account.move).
 * 
 * @param {Object} bill - Authoritative POS bill
 * @param {Object} [options={}] - Journal/partner overrides
 * @returns {Object} Odoo account.move payload
 */
export function mapBillToOdooInvoice(bill, options = {}) {
  const billNumber = bill.billNumber || "INV-UNKNOWN";
  const issueDate = bill.issueDate || bill.createdAt || new Date();
  const dateStr = new Date(issueDate).toISOString().split("T")[0];

  // Map invoice line items
  const lines = (bill.items || bill.lines || []).map(item => {
    const qty = Number(item.quantity) || 1;
    const priceUnit = item.unitPricePaise !== undefined
      ? item.unitPricePaise / 100
      : (Number(item.price) || 0);

    const discountPercent = item.discountPercent || (
      item.discountPaise && item.grossAmountPaise
        ? (item.discountPaise / item.grossAmountPaise) * 100
        : 0
    );

    return [0, 0, {
      name: item.name || item.itemName || "Menu Item",
      quantity: qty,
      price_unit: Number(priceUnit.toFixed(2)),
      discount: Number(discountPercent.toFixed(2))
    }];
  });

  // If no detailed lines are attached, create single aggregate line
  if (lines.length === 0) {
    const totalRupees = bill.grandTotalPaise !== undefined
      ? bill.grandTotalPaise / 100
      : (Number(bill.totalAmount) || 0);

    lines.push([0, 0, {
      name: `POS Dining Bill #${billNumber}`,
      quantity: 1,
      price_unit: Number(totalRupees.toFixed(2))
    }]);
  }

  return {
    move_type: "out_invoice",
    ref: billNumber,
    external_reference: `HOTEL_POS_INV_${billNumber}`,
    invoice_date: dateStr,
    date: dateStr,
    narration: `Issued by Hotel POS. Table: ${bill.tableName || bill.tableNumber || "Direct"}`,
    partner_id: options.partnerId || false,
    invoice_line_ids: lines
  };
}

/**
 * Map an authoritative payment to an Odoo Payment (account.payment).
 * 
 * @param {Object} payment - Dedicated payment record
 * @param {Object} [options={}]
 * @returns {Object} Odoo account.payment payload
 */
export function mapPaymentToOdooPayment(payment, options = {}) {
  const receiptNumber = payment.receiptNumber || "REC-UNKNOWN";
  const paymentDate = payment.recordedAt || payment.createdAt || new Date();
  const dateStr = new Date(paymentDate).toISOString().split("T")[0];

  const amountRupees = payment.amountPaise !== undefined
    ? payment.amountPaise / 100
    : (Number(payment.amount) || 0);

  const tender = (payment.tender || payment.paymentMethod || "cash").toLowerCase();

  return {
    payment_type: "inbound",
    partner_type: "customer",
    amount: Number(amountRupees.toFixed(2)),
    date: dateStr,
    ref: receiptNumber,
    external_reference: `HOTEL_POS_REC_${receiptNumber}`,
    communication: `POS Payment for ${payment.billNumber || "Invoice"} (${tender.toUpperCase()})`,
    journal_id: options.journalId || false,
    partner_id: options.partnerId || false
  };
}

/**
 * Map a credit note to an Odoo Customer Refund (account.move out_refund).
 * 
 * @param {Object} creditNote - Authoritative credit note
 * @param {Object} [options={}]
 * @returns {Object} Odoo account.move payload
 */
export function mapCreditNoteToOdooRefund(creditNote, options = {}) {
  const cnNumber = creditNote.creditNoteNumber || "CN-UNKNOWN";
  const issueDate = creditNote.issuedAt || creditNote.createdAt || new Date();
  const dateStr = new Date(issueDate).toISOString().split("T")[0];

  const amountRupees = creditNote.amountPaise !== undefined
    ? creditNote.amountPaise / 100
    : (Number(creditNote.amount) || 0);

  return {
    move_type: "out_refund",
    ref: cnNumber,
    external_reference: `HOTEL_POS_CN_${cnNumber}`,
    invoice_date: dateStr,
    date: dateStr,
    narration: `Credit Note for Bill #${creditNote.billNumber || ""}: ${creditNote.reasonText || creditNote.reasonCode || ""}`,
    partner_id: options.partnerId || false,
    invoice_line_ids: [
      [0, 0, {
        name: `Credit Adjustment: ${creditNote.reasonText || "Correction"}`,
        quantity: 1,
        price_unit: Number(amountRupees.toFixed(2))
      }]
    ]
  };
}

/**
 * Map customer to Odoo Partner (res.partner).
 * 
 * @param {Object} customer
 * @returns {Object} Odoo res.partner payload
 */
export function mapCustomerToOdooPartner(customer) {
  const custId = customer._id?.toString() || customer.id || "CUST-UNKNOWN";
  return {
    name: customer.name || customer.customerName || "Hotel Guest",
    phone: customer.phone || customer.phoneNumber || false,
    email: customer.email || false,
    comment: `Synced from Hotel POS (ID: ${custId})`,
    ref: `HOTEL_POS_CUST_${custId}`
  };
}
