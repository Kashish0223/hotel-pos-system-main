import { findDocuments, insertDocument } from "@/lib/db-config";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

export async function GET(request) {
  try {
        // const headerList = await headers();
        // const authHeader = headerList.get("Authorization");
        // // console.log("STaff get header:---",authHeader);
    
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
    
    // Check if there's a tableNumber query parameter
    const { searchParams } = new URL(request.url);
    const tableNumber = searchParams.get("tableNumber");
    
    let query = {};
    if (tableNumber) {
      query.tableNumber = tableNumber;
    }
    
    const tables = await findDocuments("tables", query, { tableNumber: 1 });
    
    return Response.json(tables);
  } catch (error) {
    return Response.json({ error: "Failed to fetch tables" }, { status: 500 });
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
    
    const data = await request.json();
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
    const result = await insertDocument("tables", data);
    return Response.json({ success: true, id: result.insertedId });
  } catch (error) {
    return Response.json({ error: "Failed to create table" }, { status: 500 });
  }
}