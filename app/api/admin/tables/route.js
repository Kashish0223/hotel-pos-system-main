import { getDatabase } from "@/lib/db-config"
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from 'next/headers'

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

export async function GET(request) {
  try {
    // 🔐 Decode JWT
     const headerList = await headers();
    const authHeader = headerList.get("Authorization");

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

    const db = await getDatabase()

    const tables = await db.collection("tables").find({}).sort({ tableNumber: 1 }).toArray()

    return Response.json(tables)
  } catch (error) {
    return Response.json({ error: "Failed to fetch tables" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
        // 🔐 Decode JWT
     const headerList = await headers();
    const authHeader = headerList.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return Response.json({ error: "No token provided" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    const db = await getDatabase()
    const data = await request.json()
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

       // Validate required fields
            if (!data.tableNumber || !data.type || !data.capacity  || !data.status) {
              return Response.json({ error: "tableNumber, capacity, and status are required" }, { status: 400 });
            }
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

    // Check if table number already exists
    const existingTable = await db.collection("tables").findOne({ tableNumber: data.tableNumber })
    if (existingTable) {
      return Response.json({ error: "Table number already exists" }, { status: 400 })
    }

    const result = await db.collection("tables").insertOne({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    return Response.json({ success: true, id: result.insertedId })
  } catch (error) {
    return Response.json({ error: "Failed to create table" }, { status: 500 })
  }
}
