import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";

export async function PUT(request, { params }) {
  try {
    const auth = await requireFinanceAuth(["manage_expenses", "admin", "superadmin", "manager"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const { status, remarks } = await request.json();

    const validStatuses = ["pending", "approved", "paid", "rejected"];
    if (!status || !validStatuses.includes(status.toLowerCase())) {
      return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
    }

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid expense ID format" }, { status: 400 });
    }

    const now = new Date();
    await db.collection("expenses").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          status: status.toLowerCase(),
          updatedAt: now,
          statusRemarks: remarks || null,
          statusUpdatedBy: auth.user.name || auth.user.email,
          ...(status.toLowerCase() === "approved" && { approvedAt: now, approvedBy: auth.user.name }),
          ...(status.toLowerCase() === "paid" && { paidAt: now, paidBy: auth.user.name })
        }
      }
    );

    return Response.json({ success: true, status: status.toLowerCase() });
  } catch (error) {
    console.error("PUT /api/expenses/[id]/status error:", error);
    return Response.json({ error: "Failed to update expense status" }, { status: 500 });
  }
}
