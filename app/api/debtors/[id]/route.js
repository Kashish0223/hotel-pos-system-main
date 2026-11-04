import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";

export async function GET(request, { params }) {
  try {
    const auth = await requireFinanceAuth(["manage_debtors", "view_debtors", "admin", "superadmin", "view_bill"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid debtor ID format" }, { status: 400 });
    }

    const debtor = await db.collection("debtors").findOne({ _id: new ObjectId(id) });
    if (!debtor) {
      return Response.json({ error: "Debtor not found" }, { status: 404 });
    }

    // Also fetch payment history
    const payments = await db.collection("debtor_payments")
      .find({ debtorId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({ success: true, debtor, payments });
  } catch (error) {
    console.error("GET /api/debtors/[id] error:", error);
    return Response.json({ error: "Failed to fetch debtor record" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireFinanceAuth(["manage_debtors", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const data = await request.json();

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid debtor ID format" }, { status: 400 });
    }

    const updateFields = { ...data, updatedAt: new Date() };
    delete updateFields._id; // Never mutate _id

    await db.collection("debtors").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("PUT /api/debtors/[id] error:", error);
    return Response.json({ error: "Failed to update debtor record" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireFinanceAuth(["manage_debtors", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid debtor ID format" }, { status: 400 });
    }

    await db.collection("debtors").deleteOne({ _id: new ObjectId(id) });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/debtors/[id] error:", error);
    return Response.json({ error: "Failed to delete debtor record" }, { status: 500 });
  }
}
