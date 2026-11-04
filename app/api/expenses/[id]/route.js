import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { requireFinanceAuth } from "@/lib/finance/guards";

export async function GET(request, { params }) {
  try {
    const auth = await requireFinanceAuth(["manage_expenses", "view_expenses", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid expense ID format" }, { status: 400 });
    }

    const expense = await db.collection("expenses").findOne({ _id: new ObjectId(id) });
    if (!expense) {
      return Response.json({ error: "Expense not found" }, { status: 404 });
    }

    return Response.json(expense);
  } catch (error) {
    console.error("GET /api/expenses/[id] error:", error);
    return Response.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const auth = await requireFinanceAuth(["manage_expenses", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const data = await request.json();

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid expense ID format" }, { status: 400 });
    }

    const updateFields = { ...data, updatedAt: new Date() };
    delete updateFields._id;

    await db.collection("expenses").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateFields }
    );

    return Response.json({ success: true });
  } catch (error) {
    console.error("PUT /api/expenses/[id] error:", error);
    return Response.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const auth = await requireFinanceAuth(["manage_expenses", "admin", "superadmin"]);
    if (!auth.authorized) {
      return Response.json({ error: auth.error }, { status: auth.status });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const resolvedParams = await params;
    const id = resolvedParams.id;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid expense ID format" }, { status: 400 });
    }

    await db.collection("expenses").deleteOne({ _id: new ObjectId(id) });

    return Response.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/expenses/[id] error:", error);
    return Response.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}
