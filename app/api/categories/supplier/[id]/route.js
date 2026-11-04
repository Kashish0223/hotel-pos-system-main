// app/api/categories/supplier/[id]/route.js
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

export async function GET(request, {params}) {
  const { id } = params;
  try {
      const headerList = await headers();
        const authHeader = headerList.get("Authorization");
        // console.log("STaff get header:---",authHeader);
    
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "No token provided" }, { status: 401 });
        }
    
        const token = authHeader.split("Bearer ")[1];
        try {
          const verified = await jwtVerify(token, secret);
          const payload = verified.payload;
          if (!payload.role)
            return Response.json(
              { error: "Invalid token (missing role)" },
              { status: 401 }
            );
        } catch (e) {
          // console.error("JWT verification failed:", e);
          return Response.json(
            { error: "Invalid or expired token" },
            { status: 401 }
          );
        }
    // Extract id from URL
    const { pathname } = new URL(request.url);
    const id = pathname.split("/").pop(); // Get last segment

    // console.log("Requested ID:", id); // Debug

    if (!id || !ObjectId.isValid(id)) {
      return new Response(
        JSON.stringify({ error: "Invalid ID", received: id }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    // Try multiple possible collections
    const collections = ["supplier_categories", "categories"];
    let supplier = null;

    for (const coll of collections) {
      supplier = await db.collection(coll).findOne({
        _id: new ObjectId(id),
      });
      if (supplier) break;
    }

    if (!supplier) {
      return new Response(
        JSON.stringify({ error: "Supplier not found", id }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify(supplier), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("API Error:", error);
    return new Response(
      JSON.stringify({ error: "Server Error", message: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
      const headerList = await headers();
        const authHeader = headerList.get("Authorization");
        // console.log("STaff get header:---",authHeader);
    
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "No token provided" }, { status: 401 });
        }
    
        const token = authHeader.split("Bearer ")[1];
        try {
          const verified = await jwtVerify(token, secret);
          const payload = verified.payload;
          if (!payload.role)
            return Response.json(
              { error: "Invalid token (missing role)" },
              { status: 401 }
            );
        } catch (e) {
          // console.error("JWT verification failed:", e);
          return Response.json(
            { error: "Invalid or expired token" },
            { status: 401 }
          );
        }
    const { id } = params; // get id from dynamic route


   if (!id || !ObjectId.isValid(id)) {
      return new Response(JSON.stringify({ error: "Invalid ID" }), { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME ||"hotel_pos"); // your DB name
    
    const result = await db
      .collection("supplier_categories")
      .deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return Response.json({ error: "Category not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return Response.json(
      { error: "Failed to delete supplier category" },
      { status: 500 }
    )
  }
}
