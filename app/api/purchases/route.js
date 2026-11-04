import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR } from "@/lib/finance/money.js";
import { getNextAtomicSequence } from "@/lib/finance/sequence.js";

/**
 * GET /api/purchases
 * List purchases filtered by supplier
 */
export async function GET(request) {
  try {
    const auth = await requireFinanceAuth(["manage_purchases", "view_purchases", "admin", "superadmin", "view_bill"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");

    const query = {};
    if (supplierId && ObjectId.isValid(supplierId)) {
      query.supplierCategoryId = new ObjectId(supplierId);
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const purchases = await db
      .collection("purchases")
      .find(query)
      .project({
        _id: 1,
        itemName: 1,
        quantity: 1,
        unit: 1,
        unitPrice: 1,
        unitPricePaise: 1,
        totalPaise: 1,
        vendorBillNumber: 1,
        billStatus: 1,
        isPaid: 1,
        createdAt: 1,
        invoicePhoto: 1,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(purchases, { status: 200 });
  } catch (error) {
    console.error("GET /api/purchases error:", error);
    return Response.json({ error: "Failed to fetch purchases" }, { status: 500 });
  }
}

/**
 * POST /api/purchases
 * Record purchases / vendor bills with duplicate invoice detection.
 * Enforces that purchase orders / GRNs are NOT treated as paid vendor invoices.
 */
export async function POST(request) {
  try {
    const auth = await requireFinanceAuth(["manage_purchases", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const body = await request.json();
    let rawItems = [];
    let vendorBillNumber = null;
    let supplierId = null;

    if (Array.isArray(body)) {
      rawItems = body;
    } else if (body && Array.isArray(body.items)) {
      rawItems = body.items;
      vendorBillNumber = (body.vendorBillNumber || body.invoiceNumber || "").trim();
      supplierId = body.supplierId || body.supplierCategoryId;
    } else {
      return Response.json({ error: "Invalid payload format. Expected items array." }, { status: 400 });
    }

    if (rawItems.length === 0) {
      return Response.json({ error: "At least one purchase item is required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    // Duplicate Vendor Bill Detection Guard
    if (vendorBillNumber && supplierId && ObjectId.isValid(supplierId)) {
      const existingVendorBill = await db.collection("purchases").findOne({
        supplierCategoryId: new ObjectId(supplierId),
        vendorBillNumber
      });

      if (existingVendorBill) {
        return Response.json({
          error: `Duplicate Vendor Invoice: Bill #${vendorBillNumber} from this supplier has already been recorded`,
          vendorBillNumber,
          supplierId
        }, { status: 409 });
      }
    }

    // Allocate atomic internal purchase batch reference
    const { formatted: purchaseRef } = await getNextAtomicSequence(
      db,
      "global_purchase_seq",
      "PUR",
      7,
      true
    );

    const now = new Date();
    const formatted = rawItems.map((item) => {
      const unitPricePaise = item.unitPricePaise !== undefined
        ? Math.round(item.unitPricePaise)
        : toPaise(item.unitPrice || 0);
      const qty = parseFloat(item.quantity) || 1;
      const totalPaise = Math.round(unitPricePaise * qty);

      return {
        purchaseRef,
        vendorBillNumber: vendorBillNumber || item.vendorBillNumber || null,
        supplierCategoryId: item.supplierCategoryId && ObjectId.isValid(item.supplierCategoryId)
          ? new ObjectId(item.supplierCategoryId)
          : supplierId && ObjectId.isValid(supplierId)
          ? new ObjectId(supplierId)
          : null,
        itemName: item.itemName,
        quantity: qty,
        unit: item.unit || "pcs",
        unitPrice: parseFloat(formatINR(unitPricePaise)),
        unitPricePaise,
        totalPaise,
        totalAmountRupees: formatINR(totalPaise),
        billStatus: item.billStatus || "approved",
        isPaid: false, // Never automatically marked as paid without verified disbursement
        invoicePhoto: item.invoicePhoto || null,
        recordedBy: auth.user.name || auth.user.email || "staff",
        createdAt: now,
      };
    });

    const result = await db.collection("purchases").insertMany(formatted);

    return Response.json({
      success: true,
      insertedCount: result.insertedCount,
      purchaseRef,
      vendorBillNumber
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/purchases error:", error);
    return Response.json({ error: error.message || "Failed to record purchases" }, { status: 500 });
  }
}