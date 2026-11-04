/**
 * Atomic Sequential Number Generator
 * Uses MongoDB findOneAndUpdate with returnDocument: 'after' to guarantee atomic,
 * non-conflicting sequences even under heavy concurrent load.
 */

/**
 * Get the next sequential identifier atomically.
 * 
 * @param {Object} db - MongoDB database handle
 * @param {string} counterKey - Identifier in `bill_counters` collection (e.g. "global_invoice_seq")
 * @param {string} prefix - e.g. "INV", "REC", "CN", "REG"
 * @param {number} [padLength=7] - Number padding length
 * @param {boolean} [includeDate=true] - Whether to include YYYYMMDD in format
 * @returns {Promise<{ seq: number, formatted: string }>}
 */
export async function getNextAtomicSequence(
  db,
  counterKey,
  prefix = "SEQ",
  padLength = 7,
  includeDate = true
) {
  if (!db || !counterKey) {
    throw new Error("db and counterKey are required for sequence generation");
  }

  // Atomic increment with upsert returning the updated document
  const result = await db.collection("bill_counters").findOneAndUpdate(
    { _id: counterKey },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: "after" }
  );

  // Compatible extraction across driver versions
  const doc = result.value !== undefined ? result.value : result;
  if (!doc || typeof doc.seq !== "number") {
    throw new Error(`Failed to generate sequential counter for ${counterKey}`);
  }

  const seq = doc.seq;
  const paddedSeq = String(seq).padStart(padLength, "0");

  let formatted = "";
  if (includeDate) {
    const today = new Date();
    const datePart = today.toISOString().split("T")[0].replace(/-/g, ""); // YYYYMMDD
    formatted = `${prefix}-${datePart}-${paddedSeq}`;
  } else {
    formatted = `${prefix}-${paddedSeq}`;
  }

  return { seq, formatted };
}
