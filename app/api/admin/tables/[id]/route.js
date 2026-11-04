import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

export const dynamic = "force-dynamic"
export async function PUT(request, { params }) {
// export async function PUT(request, context) {
  try {
        // 🔐 Decode JWT
         const headerList = await headers();
        const authHeader = headerList.get("Authorization");
    
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return Response.json({ error: "No token provided" }, { status: 401 });
        }
    
        const token = authHeader.split("Bearer ")[1];
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

    // Await params first, then extract id
    const resolvedParams = await params
    const id = resolvedParams.id

    const data = await request.json()
    const { _id, ...updateData } = data

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
    

    const result = await db.collection("tables").updateOne(
      // { _id: new ObjectId(await params.id) },
      { _id: new ObjectId(id) },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      },
    )

    if (result.matchedCount === 0) {
      return Response.json({ error: "Table not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Failed to update table" }, { status: 500 })
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
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    // Await params first, then extract id
    const resolvedParams = await params
    const id = resolvedParams.id

    const result = await db.collection("tables").deleteOne({ _id: new ObjectId(id) })

    if (result.deletedCount === 0) {
      return Response.json({ error: "Table not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Failed to delete table" }, { status: 500 })
  }
}
