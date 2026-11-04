import { getDatabase } from "@/lib/db-config";
import { getNextAtomicSequence } from "@/lib/finance/sequence";
import { odooClient } from "./client.js";
import {
  mapBillToOdooInvoice,
  mapPaymentToOdooPayment,
  mapCreditNoteToOdooRefund,
  mapCustomerToOdooPartner
} from "./mapper.js";

/**
 * Durable Transactional Outbox for Odoo Synchronization
 * 
 * Guarantees:
 * 1. At-least-once delivery with idempotent deduplication via external reference.
 * 2. Independent commit recovery: Reconciles via Odoo search before retrying create.
 * 3. Atomic lease locking: Prevents concurrent worker collisions.
 * 4. Exponential backoff retry state machine: 1s, 2s, 4s, 8s, 16s -> dead-letter after 5 tries.
 */

/**
 * Enqueue an event into the persistent Odoo outbox.
 * 
 * @param {Object} params
 * @param {string} params.eventType - e.g. "INVOICE_CREATED", "PAYMENT_RECORDED", "CREDIT_NOTE_ISSUED"
 * @param {string} params.entityType - "bill", "payment", "credit_note", "customer"
 * @param {string} params.entityId - Local MongoDB ID
 * @param {string} params.referenceId - Stable external identifier (e.g. HOTEL_POS_INV_...)
 * @param {Object} params.payload - Domain record data
 * @returns {Promise<Object>} Created outbox record
 */
export async function enqueueOdooOutbox({
  eventType,
  entityType,
  entityId,
  referenceId,
  payload
}) {
  const db = await getDatabase();
  const { formatted: eventId } = await getNextAtomicSequence(db, "odoo_outbox_seq", "OOB");

  const outboxRecord = {
    eventId,
    eventType,
    entityType,
    entityId: entityId?.toString(),
    referenceId,
    payload,
    status: "pending", // "pending" | "processing" | "completed" | "failed" | "dead_letter"
    attempts: 0,
    maxAttempts: 5,
    nextAttemptAt: new Date(),
    leaseExpiresAt: null,
    odooId: null,
    lastError: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  await db.collection("odoo_outbox").insertOne(outboxRecord);
  return outboxRecord;
}

/**
 * Process a batch of pending/failed outbox events.
 * 
 * @param {Object} [options={}]
 * @param {number} [options.batchSize=10]
 * @param {number} [options.leaseDurationMs=30000]
 * @param {OdooClient} [options.client=odooClient]
 * @returns {Promise<{ processed: number, succeeded: number, failed: number, skipped?: boolean }>}
 */
export async function processOdooOutboxBatch(options = {}) {
  const {
    batchSize = 10,
    leaseDurationMs = 30000,
    client = odooClient
  } = options;

  const configCheck = client.isConfigured();
  if (!configCheck.configured) {
    return {
      processed: 0,
      succeeded: 0,
      failed: 0,
      skipped: true,
      reason: "Odoo integration is gated: credentials not configured in environment."
    };
  }

  const db = await getDatabase();
  const now = new Date();

  // Find candidate events that are pending or failed, within maxAttempts, and not actively leased
  const candidates = await db.collection("odoo_outbox").find({
    status: { $in: ["pending", "failed"] },
    attempts: { $lt: 5 },
    nextAttemptAt: { $lte: now },
    $or: [
      { leaseExpiresAt: null },
      { leaseExpiresAt: { $lt: now } }
    ]
  }).sort({ nextAttemptAt: 1 }).limit(batchSize).toArray();

  let succeeded = 0;
  let failed = 0;

  for (const event of candidates) {
    // Atomically claim lease on this event
    const leaseExpires = new Date(Date.now() + leaseDurationMs);
    const leaseResult = await db.collection("odoo_outbox").findOneAndUpdate(
      {
        _id: event._id,
        status: { $in: ["pending", "failed"] },
        $or: [
          { leaseExpiresAt: null },
          { leaseExpiresAt: { $lt: now } }
        ]
      },
      {
        $set: {
          status: "processing",
          leaseExpiresAt: leaseExpires,
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

    if (!leaseResult) {
      // Lease collision or already claimed by another worker
      continue;
    }

    try {
      // Dispatch event to Odoo with recovery state machine
      const result = await syncEventToOdoo(event, client);

      if (result.success) {
        // Mark event completed
        await db.collection("odoo_outbox").updateOne(
          { _id: event._id },
          {
            $set: {
              status: "completed",
              odooId: result.odooId,
              reconciled: result.reconciled || false,
              leaseExpiresAt: null,
              syncedAt: new Date(),
              updatedAt: new Date()
            }
          }
        );
        succeeded++;
      } else {
        throw new Error(result.error || "Odoo synchronization failed");
      }
    } catch (err) {
      const attempts = (event.attempts || 0) + 1;
      const isDeadLetter = attempts >= (event.maxAttempts || 5);

      // Exponential backoff: 1s, 2s, 4s, 8s, 16s
      const backoffMs = Math.min(300000, Math.pow(2, attempts) * 1000);
      const nextAttemptAt = new Date(Date.now() + backoffMs);

      await db.collection("odoo_outbox").updateOne(
        { _id: event._id },
        {
          $set: {
            status: isDeadLetter ? "dead_letter" : "failed",
            attempts,
            lastError: err.message,
            nextAttemptAt: isDeadLetter ? null : nextAttemptAt,
            leaseExpiresAt: null,
            updatedAt: new Date()
          }
        }
      );
      failed++;
    }
  }

  return {
    processed: candidates.length,
    succeeded,
    failed
  };
}

/**
 * Execute single event sync with recovery state machine.
 * Prevents duplicate creates if previous commit succeeded but response timed out.
 */
async function syncEventToOdoo(event, client) {
  let model = "";
  let payload = {};

  if (event.entityType === "bill") {
    model = "account.move";
    payload = mapBillToOdooInvoice(event.payload);
  } else if (event.entityType === "payment") {
    model = "account.payment";
    payload = mapPaymentToOdooPayment(event.payload);
  } else if (event.entityType === "credit_note") {
    model = "account.move";
    payload = mapCreditNoteToOdooRefund(event.payload);
  } else if (event.entityType === "customer") {
    model = "res.partner";
    payload = mapCustomerToOdooPartner(event.payload);
  } else {
    return { success: false, error: `Unsupported entity type: ${event.entityType}` };
  }

  // 1. RECOVERY CHECK: Check if entity with this external reference already exists in Odoo
  const searchCheck = await client.executeKw(model, "search_read", [
    [["ref", "=", event.referenceId]]
  ], { fields: ["id", "ref"], limit: 1 });

  if (searchCheck.success && Array.isArray(searchCheck.result) && searchCheck.result.length > 0) {
    // Already created in Odoo on a prior attempt! Reconcile cleanly.
    return {
      success: true,
      odooId: searchCheck.result[0].id,
      reconciled: true
    };
  }

  // 2. CREATE ENTITY IN ODOO
  const createResult = await client.executeKw(model, "create", [payload]);
  if (!createResult.success) {
    return { success: false, error: createResult.error };
  }

  return {
    success: true,
    odooId: createResult.result,
    reconciled: false
  };
}

/**
 * Query real-time metrics of the Odoo outbox queue.
 */
export async function getOdooOutboxStats() {
  const db = await getDatabase();
  const pipeline = [
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ];

  const results = await db.collection("odoo_outbox").aggregate(pipeline).toArray();
  const stats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    dead_letter: 0,
    total: 0
  };

  results.forEach(r => {
    if (stats[r._id] !== undefined) {
      stats[r._id] = r.count;
    }
    stats.total += r.count;
  });

  return stats;
}

/**
 * Replay a dead-letter or failed outbox event manually.
 */
export async function replayOdooOutboxEvent(eventId) {
  const db = await getDatabase();
  const result = await db.collection("odoo_outbox").updateOne(
    { eventId },
    {
      $set: {
        status: "pending",
        attempts: 0,
        nextAttemptAt: new Date(),
        leaseExpiresAt: null,
        updatedAt: new Date()
      }
    }
  );

  return result.modifiedCount > 0;
}
