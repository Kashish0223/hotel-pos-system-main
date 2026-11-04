import { toPaise, formatINR, roundHalfUp } from "./money.js";

/**
 * Standard Reason Codes for Discounts
 */
export const DISCOUNT_REASON_CODES = {
  PROMOTION: { code: "promotion", label: "Promotional Campaign / Happy Hour", requiresManager: false },
  GUEST_SATISFACTION: { code: "guest_satisfaction", label: "Guest Satisfaction / Service Recovery", requiresManager: true },
  FOOD_QUALITY: { code: "food_quality", label: "Food Quality / Preparation Defect", requiresManager: true },
  STAFF_BENEFIT: { code: "staff_benefit", label: "Staff / Employee Benefit", requiresManager: false },
  MANAGER_DISCRETION: { code: "manager_discretion", label: "Manager Discretionary Comp", requiresManager: true },
  DAMAGED_SPILLAGE: { code: "damaged_spillage", label: "Damaged / Accidental Spillage", requiresManager: true }
};

/**
 * Default threshold rules:
 * - Cashier limit: Up to 10% (1000 basis points) or max ₹200 (20000 paise) flat.
 * - Any discount exceeding these limits requires manager/admin authorization.
 */
export const CASHIER_DISCOUNT_LIMITS = {
  MAX_PERCENT_BPS: 1000, // 10.00%
  MAX_FLAT_PAISE: 20000  // ₹200.00
};

/**
 * Validate and verify discount authorization.
 * 
 * @param {Object} params
 * @param {number} params.grossSubtotalPaise - Gross order amount before discount
 * @param {number} params.discountPaise - Requested discount in paise
 * @param {string} params.reasonCode - One of DISCOUNT_REASON_CODES
 * @param {string} [params.reasonText] - Optional narrative explanation
 * @param {Object} params.operator - The staff member proposing the discount { id, name, role }
 * @param {Object} [params.approver] - Authorizing manager if threshold is exceeded { id, name, role }
 * @returns {Object} { authorized: boolean, requiresManager: boolean, error?: string, approvedDiscountPaise: number }
 */
export function validateDiscountAuthorization({
  grossSubtotalPaise,
  discountPaise,
  reasonCode,
  reasonText = "",
  operator,
  approver = null
}) {
  const gross = Math.max(0, Math.round(grossSubtotalPaise || 0));
  const discount = Math.max(0, Math.round(discountPaise || 0));

  if (discount <= 0) {
    return {
      authorized: true,
      requiresManager: false,
      approvedDiscountPaise: 0,
      reasonCode: null
    };
  }

  // Discount cannot exceed 100% of gross subtotal
  if (discount > gross) {
    return {
      authorized: false,
      error: `Discount amount (₹${formatINR(discount)}) cannot exceed gross subtotal (₹${formatINR(gross)})`,
      approvedDiscountPaise: 0
    };
  }

  // Reason code validation
  const matchedReason = Object.values(DISCOUNT_REASON_CODES).find(r => r.code === reasonCode);
  if (!matchedReason) {
    return {
      authorized: false,
      error: `Invalid discount reason code: "${reasonCode}". Must be one of: ${Object.values(DISCOUNT_REASON_CODES).map(r => r.code).join(", ")}`,
      approvedDiscountPaise: 0
    };
  }

  // Check if cashier exceeds threshold
  const isOperatorManager = ["manager", "admin", "superadmin"].includes(operator?.role?.toLowerCase());
  const discountPctBps = gross > 0 ? roundHalfUp((discount / gross) * 10000) : 0;

  const exceedsThreshold = discountPctBps > CASHIER_DISCOUNT_LIMITS.MAX_PERCENT_BPS ||
                           discount > CASHIER_DISCOUNT_LIMITS.MAX_FLAT_PAISE;

  const requiresManager = matchedReason.requiresManager || exceedsThreshold;

  if (requiresManager && !isOperatorManager) {
    // Requires separate manager authorization
    if (!approver || !["manager", "admin", "superadmin"].includes(approver.role?.toLowerCase())) {
      return {
        authorized: false,
        requiresManager: true,
        error: `Discount of ₹${formatINR(discount)} (${(discountPctBps / 100).toFixed(1)}%) with reason '${matchedReason.label}' requires Manager or Admin authorization`,
        approvedDiscountPaise: 0
      };
    }
  }

  return {
    authorized: true,
    requiresManager,
    approvedDiscountPaise: discount,
    discountPctBps,
    reasonCode: matchedReason.code,
    reasonLabel: matchedReason.label,
    reasonText: reasonText || matchedReason.label,
    approvedBy: approver || operator
  };
}
