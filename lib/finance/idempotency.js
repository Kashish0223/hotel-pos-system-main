import crypto from "crypto";
import { getDatabase } from "@/lib/db-config";

/**
 * Compute SHA-256 hash of a payload object or string.
 * @param {any} payload 
 * @returns {string} Hex hash
 */
export function hashPayload(payload) {
  const str = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  return crypto.createHash("sha256").update(str).digest("hex");
}

/**
 * Idempotency check and record guard.
 * 
 * @param {string} idempotencyKey - Supplied via X-Idempotency-Key header
 * @param {any} payload - Mutation payload
 * @param {Function} executionHandler - Async callback that produces the result if not cached
 * @returns {Promise<{ statusCode: number, body: any, cached: boolean }>}
 */
export async function withIdempotency(idempotencyKey, payload, executionHandler) {
  // If no idempotency key provided, execute directly
  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    const result = await executionHandler();
    return { ...result, cached: false };
  }

  const db = await getDatabase();
  const collection = db.collection("idempotency_keys");
  const payloadHash = hashPayload(payload);

  // Attempt to claim this idempotency key
  const now = new Date();
  try {
    const existing = await collection.findOne({ _id: idempotencyKey });

    if (existing) {
      // Key exists: check payload hash match
      if (existing.payloadHash !== payloadHash) {
        return {
          statusCode: 409,
          body: {
            error: "Idempotency Conflict: Same key used with different payload",
            idempotencyKey
          },
          cached: false
        };
      }

      // If execution is completed, return the cached result
      if (existing.status === "completed") {
        return {
          statusCode: existing.statusCode || 200,
          body: existing.responseBody,
          cached: true
        };
      }

      // If execution is in-progress (concurrent request)
      if (existing.status === "pending") {
        return {
          statusCode: 429,
          body: {
            error: "Request already in progress. Please retry after a moment.",
            idempotencyKey
          },
          cached: false
        };
      }
    }

    // Insert pending marker
    await collection.insertOne({
      _id: idempotencyKey,
      payloadHash,
      status: "pending",
      createdAt: now
    });

  } catch (err) {
    // Duplicate key race condition
    if (err.code === 11000) {
      const duplicate = await collection.findOne({ _id: idempotencyKey });
      if (duplicate && duplicate.status === "completed" && duplicate.payloadHash === payloadHash) {
        return {
          statusCode: duplicate.statusCode || 200,
          body: duplicate.responseBody,
          cached: true
        };
      }
      return {
        statusCode: 409,
        body: { error: "Idempotency key conflict", idempotencyKey },
        cached: false
      };
    }
    throw err;
  }

  // Execute the underlying financial operation
  try {
    const outcome = await executionHandler();

    // Persist completed outcome
    await collection.updateOne(
      { _id: idempotencyKey },
      {
        $set: {
          status: "completed",
          statusCode: outcome.statusCode || 200,
          responseBody: outcome.body,
          completedAt: new Date()
        }
      }
    );

    return { ...outcome, cached: false };
  } catch (execError) {
    // In case of handler failure, remove pending marker so it can be retried
    await collection.deleteOne({ _id: idempotencyKey, status: "pending" }).catch(() => {});
    throw execError;
  }
}
