import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;


export async function GET(request, { params }) {
  try {
    // 🔐 Auth
    const headerList = headers();
    const authHeader = headerList.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "No token" }, { status: 401 });
    }

    await jwtVerify(authHeader.split("Bearer ")[1], secret);

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const { id } = params;

    const inventory = await db.collection("inventory").findOne(
      { _id: new ObjectId(id) },
      { projection: { currentStock: 1 } }
    );

    if (!inventory) {
      return Response.json({ error: "Inventory not found" }, { status: 404 });
    }

    return Response.json({
      available: inventory.currentStock ?? 0
    });

  } catch (error) {
    console.error("Stock GET error:", error);
    return Response.json({ error: "Failed to fetch stock" }, { status: 500 });
  }
}
export async function PUT(request, { params }) {
  try {
        // 🔐 Decode JWT
        const headerList = await headers();
        const authHeader = headerList.get("Authorization");
    
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "No token provided" }, { status: 401 });
        }
    
        const token = authHeader.split("Bearer ")[1];
        // console.log("Stock Token received:", token);
        let payload;
        try {
          const verified = await jwtVerify(token, secret);
          payload = verified.payload;
        } catch (e) {
          console.error("JWT verification failed:", e);
          return Response.json(
            { error: "Invalid or expired token" },
            { status: 401 }
          );
        }
    
        const tokenRole = payload.role;
        const tokenPermissions = Array.isArray(payload.permissions)
          ? payload.permissions
          : [];
        const isSuperAdmin = payload.isSuperAdmin || false;
    
        if (!tokenRole)
          return Response.json(
            { error: "Invalid token (missing role)" },
            { status: 401 }
          );
    
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    // const { stock, type, permissions, role } = await request.json()
     const body = await request.json();
    const { stock, type = "adjustment" } = body;
    // console.log('params:',stock,type);
    const resolvedParams = await params
    const id = resolvedParams.id
    // console.log('Stock id:', id);
     // Validate requested permissions (only if not SuperAdmin)
        // if (!(tokenRole === "superadmin" || isSuperAdmin)) {
        //   const requestedPermissions = Array.isArray(data.permissions)
        //     ? data.permissions
        //     : [];
        //   const forbidden = requestedPermissions.filter(
        //     (p) => !tokenPermissions.includes(p)
        //   );
        //   if (forbidden.length > 0) {
        //     return Response.json(
        //       {
        //         error: `Permission mismatch: You don't have permission: ${forbidden.join(
        //           ", "
        //         )}`,
        //       },
        //       { status: 403 }
        //     );
        //   }
        // }
    
        // // Assign default permissions
        // const defaultPermissions = ROLE_PERMISSIONS[data.role] || [];
        // let finalPermissions = defaultPermissions.filter((p) => p !== "*");
    
        // // Merge custom permissions if allowed
        // if (Array.isArray(data.permissions) && data.permissions.length > 0) {
        //   if (!canManagePermissions(tokenRole, isSuperAdmin)) {
        //     return Response.json(
        //       { error: "Only SuperAdmin can assign or modify permissions" },
        //       { status: 403 }
        //     );
        //   }
        //   finalPermissions = [
        //     ...new Set([...finalPermissions, ...data.permissions]),
        //   ];
        // }
    // Update stock
    await db.collection("inventory").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          currentStock: stock,
          updatedAt: new Date(),
        },
      },
    )

    // Log stock movement
    await db.collection("stock_movements").insertOne({
      inventoryId: new ObjectId(id),
      type, // 'in', 'out', 'adjustment'
      quantity: stock,
      date: new Date(),
      reason: type === "adjustment" ? "Manual adjustment" : type,
    })

    return Response.json({ success: true })
  } catch (error) {
    return(
      //  console.log("Error updating stock:--->>",error),
       Response.json({ error: "Failed to update stock" }, { status: 500 })
    )
  }
}
