import { MongoClient } from "mongodb";
import path from "node:path";
import dotenv from "dotenv";
import { toPaise, formatINR } from "../lib/finance/money.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_pos";
const dbName = process.env.MONGODB_NAME || "hotel_pos";

/**
 * Pure transformation function for upgrading a legacy bill to Schema V2.
 * 
 * Rules:
 * 1. NEVER alters or invents billNumber (historical document authority preserved).
 * 2. Computes exact integer minor units (paise) without float rounding drift.
 * 3. Classifies unresolved payment status truthfully: never fabricates receipts without evidence.
 * 
 * @param {Object} legacyBill - Raw document from MongoDB bills collection
 * @param {string} [batchId="BATCH-DEFAULT"] - Unique identifier for this migration run
 * @returns {Object} Updated fields to set on the document
 */
export function transformLegacyBillToSchemaV2(legacyBill, batchId = "BATCH-DEFAULT") {
  // If already at schemaVersion >= 2, no change needed
  if (legacyBill.schemaVersion && legacyBill.schemaVersion >= 2) {
    return null;
  }

  const rawGross = Number(legacyBill.subtotal || legacyBill.totalAmount || 0);
  const rawDiscount = Number(legacyBill.discount || 0);
  const rawTax = Number(legacyBill.tax || 0);
  const rawGrandTotal = Number(legacyBill.totalAmount || 0);

  const grossSubtotalPaise = legacyBill.grossSubtotalPaise !== undefined
    ? legacyBill.grossSubtotalPaise
    : toPaise(rawGross);

  const totalDiscountPaise = legacyBill.totalDiscountPaise !== undefined
    ? legacyBill.totalDiscountPaise
    : toPaise(rawDiscount);

  const taxableAmountPaise = Math.max(0, grossSubtotalPaise - totalDiscountPaise);

  const totalTaxPaise = legacyBill.totalTaxPaise !== undefined
    ? legacyBill.totalTaxPaise
    : toPaise(rawTax);

  const grandTotalPaise = legacyBill.grandTotalPaise !== undefined
    ? legacyBill.grandTotalPaise
    : toPaise(rawGrandTotal);

  // Determine payment and balance classification based on historical evidence
  let paidAmountPaise = 0;
  let balanceDuePaise = grandTotalPaise;
  let truthfulStatus = legacyBill.status || "unpaid";

  if (legacyBill.paidAmountPaise !== undefined) {
    paidAmountPaise = legacyBill.paidAmountPaise;
    balanceDuePaise = Math.max(0, grandTotalPaise - paidAmountPaise);
  } else if (legacyBill.status === "paid" || legacyBill.paymentMethod) {
    // Historical bill has explicit paid status or paymentMethod recorded
    paidAmountPaise = grandTotalPaise;
    balanceDuePaise = 0;
    truthfulStatus = "paid";
  } else if (legacyBill.status === "partially_paid") {
    // If partial amount was stored, use it; otherwise flag balance due
    const legacyPaid = Number(legacyBill.paidAmount || 0);
    paidAmountPaise = toPaise(legacyPaid);
    balanceDuePaise = Math.max(0, grandTotalPaise - paidAmountPaise);
    truthfulStatus = balanceDuePaise === 0 ? "paid" : "partially_paid";
  } else if (legacyBill.status === "cancelled" || legacyBill.status === "void") {
    truthfulStatus = legacyBill.status;
    balanceDuePaise = 0;
  }

  // Dual GST split for legacy bills without itemized tax breakdowns
  const cgstPaise = Math.round(totalTaxPaise / 2);
  const sgstPaise = totalTaxPaise - cgstPaise;

  return {
    schemaVersion: 2,
    grossSubtotalPaise,
    totalDiscountPaise,
    taxableAmountPaise,
    totalTaxPaise,
    taxBreakdown: {
      cgstPaise,
      sgstPaise,
      igstPaise: 0
    },
    grandTotalPaise,
    paidAmountPaise,
    balanceDuePaise,
    status: truthfulStatus,
    provenance: {
      migratedFromSchema: legacyBill.schemaVersion || 1,
      migrationBatch: batchId,
      migratedAt: new Date()
    }
  };
}

/**
 * Migration Runner
 */
async function runMigration() {
  const args = process.argv.slice(2);
  const isLive = args.includes("--live");
  const isDryRun = !isLive;
  const batchId = `MIG-${new Date().toISOString().replace(/[-:T.]/g, "").slice(0, 14)}`;

  console.log("========================================================");
  console.log(`HOTEL POS - HISTORICAL FINANCE MIGRATION RUNNER`);
  console.log(`Mode:     ${isLive ? "LIVE EXECUTION (Database will be updated)" : "DRY RUN (Analysis only, no writes)"}`);
  console.log(`Batch ID: ${batchId}`);
  console.log(`Database: ${dbName}`);
  console.log("========================================================\n");

  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected to MongoDB successfully.\n");
  } catch (err) {
    console.error("MongoDB Connection Failed:", err.message);
    process.exit(1);
  }

  try {
    const db = client.db(dbName);
    const billsCollection = db.collection("bills");

    const query = {
      $or: [
        { schemaVersion: { $exists: false } },
        { schemaVersion: 1 }
      ]
    };

    const totalEligible = await billsCollection.countDocuments(query);
    console.log(`Scanning bills collection...`);
    console.log(`Found ${totalEligible} legacy bills requiring Schema V2 upgrade.\n`);

    if (totalEligible === 0) {
      console.log("All bills are already upgraded to Schema V2. Nothing to migrate.");
      await client.close();
      return;
    }

    const cursor = billsCollection.find(query);
    let migratedCount = 0;
    let totalRevenuePaise = 0;
    let totalPaidPaise = 0;
    let totalBalancePaise = 0;

    while (await cursor.hasNext()) {
      const doc = await cursor.next();
      const updates = transformLegacyBillToSchemaV2(doc, batchId);

      if (updates) {
        migratedCount++;
        totalRevenuePaise += updates.grandTotalPaise;
        totalPaidPaise += updates.paidAmountPaise;
        totalBalancePaise += updates.balanceDuePaise;

        if (isLive) {
          await billsCollection.updateOne(
            { _id: doc._id },
            { $set: updates }
          );
        }
      }
    }

    console.log("----------------- RECONCILIATION SUMMARY -----------------");
    console.log(`Bills Processed:      ${migratedCount}`);
    console.log(`Total Billed Revenue: ₹${formatINR(totalRevenuePaise)} (${totalRevenuePaise} paise)`);
    console.log(`Total Historical Paid:₹${formatINR(totalPaidPaise)} (${totalPaidPaise} paise)`);
    console.log(`Total Balance Due:    ₹${formatINR(totalBalancePaise)} (${totalBalancePaise} paise)`);
    console.log("----------------------------------------------------------\n");

    if (isDryRun) {
      console.log("DRY RUN COMPLETE. Zero database writes were executed.");
      console.log("To apply these changes permanently, run:");
      console.log("  node scripts/migrate-finance.mjs --live\n");
    } else {
      console.log(`LIVE MIGRATION COMPLETE. ${migratedCount} documents upgraded to Schema V2.\n`);
    }
  } finally {
    await client.close();
  }
}

// Execute if run directly from CLI
if (process.argv[1] && process.argv[1].endsWith("migrate-finance.mjs")) {
  runMigration().catch(err => {
    console.error("Migration error:", err);
    process.exit(1);
  });
}
