import { getDatabase } from "@/lib/db-config";

/**
 * Record an immutable financial audit log entry.
 * 
 * @param {Object} entry
 * @param {string} entry.action - e.g. "invoice_issued", "payment_recorded", "discount_approved", "credit_note_issued"
 * @param {string} entry.entityType - e.g. "invoice", "payment", "register_session", "credit_note"
 * @param {string} entry.entityId - ID or Number of the primary entity
 * @param {Object} [entry.actor] - User who executed the action { id, name, role, email }
 * @param {Object} [entry.approver] - Manager who approved if threshold exceeded
 * @param {string} [entry.outletId] - Outlet scope
 * @param {number} [entry.amountPaise] - Monetary impact if applicable
 * @param {string} [entry.reasonCode] - e.g. "pricing_error", "manager_comp", "spoilage"
 * @param {string} [entry.reasonText] - Human explanation
 * @param {Object} [entry.beforeSnapshot] - State before mutation
 * @param {Object} [entry.afterSnapshot] - State after mutation
 * @returns {Promise<Object>} Inserted audit document
 */
export async function recordAuditEvent({
  action,
  entityType,
  entityId,
  actor = {},
  approver = null,
  outletId = null,
  amountPaise = 0,
  reasonCode = null,
  reasonText = null,
  beforeSnapshot = null,
  afterSnapshot = null,
  metadata = {}
}) {
  if (!action || !entityType || !entityId) {
    throw new Error("action, entityType, and entityId are required for audit records");
  }

  const db = await getDatabase();
  const auditDoc = {
    action,
    entityType,
    entityId: String(entityId),
    actor: {
      id: actor.id || actor._id || "system",
      name: actor.name || "Unknown",
      role: actor.role || "unknown",
      email: actor.email || null
    },
    approver: approver ? {
      id: approver.id || approver._id,
      name: approver.name,
      role: approver.role
    } : null,
    outletId: outletId || "default",
    amountPaise: Math.round(amountPaise || 0),
    reasonCode,
    reasonText,
    beforeSnapshot,
    afterSnapshot,
    metadata,
    timestamp: new Date()
  };

  const result = await db.collection("audit_logs").insertOne(auditDoc);
  return { ...auditDoc, _id: result.insertedId };
}
