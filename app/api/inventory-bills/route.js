import clientPromise from "@/lib/mongodb"
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

// Collection name for inventory bills
const COLLECTION = "inventory_bills";

// GET /api/inventory-bills
// Returns list of inventory bills sorted by createdAt desc
export async function GET() {
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
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const bills = await db
      .collection(COLLECTION)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json(bills);
  } catch (error) {
    console.error("GET /api/inventory-bills error:", error);
    return Response.json({ error: "Failed to fetch inventory bills" }, { status: 500 });
  }
}

// POST /api/inventory-bills
// Creates a new inventory bill
// Expected body: { billNumber, vendor, items: [{ name, qty, unitCost, total }], totalAmount, status }
export async function POST(request) {
  try {
     // 🔐 Decode JWT
         const headerList = await headers();
        const authHeader = headerList.get("Authorization");
    
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "No token provided" }, { status: 401 });
        }
    
        const token = authHeader.split("Bearer ")[1];
        let payloadIB;
        try {
          const verified = await jwtVerify(token, secret);
          payloadIB = verified.payloadIB;
        } catch (e) {
          console.error("JWT verification failed:", e);
          return Response.json(
            { error: "Invalid or expired token" },
            { status: 401 }
          );
        }
    
        const tokenRole = payloadIB.role;
        const tokenPermissions = Array.isArray(payloadIB.permissions)
          ? payloadIB.permissions
          : [];
        const isSuperAdmin = payloadIB.isSuperAdmin || false;
    
        if (!tokenRole)
          return Response.json(
            { error: "Invalid token (missing role)" },
            { status: 401 }
          );

    const payload = await request.json();
   // Validate requested permissions (only if not SuperAdmin)
    if (!(tokenRole === "superadmin" || isSuperAdmin)) {
      const requestedPermissions = Array.isArray(data.permissions)
        ? data.permissions
        : [];
      const forbidden = requestedPermissions.filter(
        (p) => !tokenPermissions.includes(p)
      );
      if (forbidden.length > 0) {
        return Response.json(
          {
            error: `Permission mismatch: You don't have permission: ${forbidden.join(
              ", "
            )}`,
          },
          { status: 403 }
        );
      }
    }

    // Assign default permissions
    const defaultPermissions = ROLE_PERMISSIONS[data.role] || [];
    let finalPermissions = defaultPermissions.filter((p) => p !== "*");

    // Merge custom permissions if allowed
    if (Array.isArray(data.permissions) && data.permissions.length > 0) {
      if (!canManagePermissions(tokenRole, isSuperAdmin)) {
        return Response.json(
          { error: "Only SuperAdmin can assign or modify permissions" },
          { status: 403 }
        );
      }
      finalPermissions = [
        ...new Set([...finalPermissions, ...data.permissions]),
      ];
    }
    // Basic normalization
    const doc = {
      billNumber: payload.billNumber || null,
      vendor: payload.vendor || payload.customerName || null,
      items: Array.isArray(payload.items) ? payload.items : [],
      totalAmount: Number(payload.totalAmount ?? 0),
      status: payload.status || "Pending",
      createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
      updatedAt: new Date(),
      // Helpful fields for UI compatibility
      customerName: payload.vendor || payload.customerName || "Inventory Purchase",
      customerPhone: payload.customerPhone || "",
      orderType: "Inventory",
    };

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const result = await db.collection(COLLECTION).insertOne(doc);

    return Response.json({ success: true, id: result.insertedId });
  } catch (error) {
    console.error("POST /api/inventory-bills error:", error);
    return Response.json({ error: "Failed to create inventory bill" }, { status: 500 });
  }
}