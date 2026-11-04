import clientPromise from "@/lib/mongodb"
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);


export async function GET() {
  try {
        // const headerList = await headers();
        // const authHeader = headerList.get("Authorization");
        // // console.log("Cateroies get header:---",authHeader);
    
        // if (!authHeader || !authHeader.startsWith("Bearer ")) {
        //   return Response.json({ error: "No token provided" }, { status: 401 });
        // }
    
        // const token = authHeader.split("Bearer ")[1];
        // try {
        //   const verified = await jwtVerify(token, secret);
        //   const payload = verified.payload;
        //   if (!payload.role)
        //     return Response.json(
        //       { error: "Invalid token (missing role)" },
        //       { status: 401 }
        //     );
        // } catch (e) {
        //   // console.error("JWT verification failed:", e);
        //   return Response.json(
        //     { error: "Invalid or expired token" },
        //     { status: 401 }
        //   );
        // }
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    // console.log(`Came in categories fetching`)
    // Get unique categories from menu items
    // const categories = await db.collection("menu").distinct("category")
    // const categories = await db.collection("categories")
    const categories = await db.collection("categories").find().toArray()

    // console.log(`Form Categories Api bla: ${JSON.stringify(categories,null,2)}`)

    // Convert to objects with _id and name
    const categoryObjects = categories.map((cat, index) => ({
      _id: `cat_${index}`,
      name: cat.name,
      icon: cat.icon,
    }))

    return Response.json(categoryObjects)
  } catch (error) {
    return Response.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function DELETE(request) {
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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return Response.json({ error: "Category ID required" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const result = await db
      .collection("inventory_categories")
      .deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return Response.json({ error: "Category not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return Response.json({ error: "Failed to delete category" }, { status: 500 });
  }
} 