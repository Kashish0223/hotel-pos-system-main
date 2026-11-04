import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";
import { toPaise, formatINR } from "@/lib/finance/money.js";
import { calculateAgeingBuckets } from "@/lib/finance/ageing.js";

/**
 * GET /api/debtors
 * List debtors with optional dynamic ageing calculation (?ageing=true).
 */
export async function GET(request) {
  try {
    const auth = await requireFinanceAuth(["manage_debtors", "view_debtors", "admin", "superadmin", "view_bill"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(request.url);
    const includeAgeing = searchParams.get("ageing") === "true";

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const debtors = await db.collection("debtors").find({}).sort({ dueDate: 1 }).toArray();

    if (includeAgeing) {
      // Calculate real-time ageing breakdown across all open debtor accounts
      const openDebtors = debtors.filter(d => (d.outstandingAmountPaise || toPaise(d.outstandingAmount || d.amount || 0)) > 0);
      const ageing = calculateAgeingBuckets({
        invoices: openDebtors.map(d => ({
          ...d,
          balanceDuePaise: d.outstandingAmountPaise || toPaise(d.outstandingAmount || d.amount || 0)
        })),
        asOfDate: new Date()
      });

      return Response.json({ success: true, debtors, ageing });
    }

    return Response.json(debtors);
  } catch (error) {
    console.error("GET /api/debtors error:", error);
    return Response.json({ error: "Failed to fetch debtors" }, { status: 500 });
  }
}

/**
 * POST /api/debtors
 * Create a new debtor record with integer paise fields and payment terms.
 */
export async function POST(request) {
  try {
    const auth = await requireFinanceAuth(["manage_debtors", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const data = await request.json();

    if (!data.name && !data.customerName) {
      return Response.json({ error: "Debtor or customer name is required" }, { status: 400 });
    }

    const customerName = (data.customerName || data.name).trim();
    const amountPaise = data.amountPaise !== undefined
      ? Math.round(data.amountPaise)
      : toPaise(data.amount || data.totalAmount || 0);

    if (amountPaise <= 0) {
      return Response.json({ error: "Total receivable amount must be greater than zero" }, { status: 400 });
    }

    const paymentTerms = data.paymentTerms || "NET30";
    let dueDate = data.dueDate ? new Date(data.dueDate) : null;
    if (!dueDate) {
      // Default to 30 days from now
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const now = new Date();
    const debtorDoc = {
      customerName,
      customerPhone: data.customerPhone || data.phone || null,
      customerEmail: data.customerEmail || data.email || null,
      company: data.company || null,
      gstin: data.gstin || null,
      invoiceNumber: data.invoiceNumber || null,
      invoiceId: data.invoiceId && ObjectId.isValid(data.invoiceId) ? new ObjectId(data.invoiceId) : null,
      totalAmountPaise: amountPaise,
      totalAmountRupees: formatINR(amountPaise),
      amount: parseFloat(formatINR(amountPaise)),
      paidAmountPaise: 0,
      outstandingAmountPaise: amountPaise,
      outstandingAmount: parseFloat(formatINR(amountPaise)),
      status: "unpaid",
      paymentTerms,
      dueDate,
      description: data.description || "",
      outlet: data.outlet || "default",
      createdBy: auth.user.name || auth.user.email || "staff",
      createdAt: now,
      updatedAt: now
    };

    const result = await db.collection("debtors").insertOne(debtorDoc);

    return Response.json({ success: true, id: result.insertedId, debtor: { ...debtorDoc, _id: result.insertedId } }, { status: 201 });
  } catch (error) {
    console.error("POST /api/debtors error:", error);
    return Response.json({ error: error.message || "Failed to create debtor record" }, { status: 500 });
  }
}
