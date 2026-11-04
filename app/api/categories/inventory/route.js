import clientPromise from "@/lib/mongodb";
import { NextResponse } from "next/server";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

// Helper: safely escape regex special chars
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export async function GET(request) {
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
    const type = searchParams.get("type");

    const query = {};
    if (type) query.type = type;

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const categories = await db
      .collection("inventory_categories")
      .find(query)
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json(categories);
  } catch (error) {
    console.error("GET /api/categories/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory categories" },
      { status: 500 }
    );
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
    
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const data = await request.json();

    const { name, description = "", icon, type = "inventory" } = data;

    // Validation
    if (!name || name.trim() === "") {
      return NextResponse.json(
        { message: "Category name is required" },
        { status: 400 }
      );
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
    

    const trimmedName = name.trim();

    // Duplicate check: case-insensitive exact match
    const existing = await db.collection("inventory_categories").findOne({
      name: { $regex: `^${escapeRegex(trimmedName)}$`, $options: "i" },
    });

    if (existing) {
      return NextResponse.json(
        { message: "A category with this name already exists." },
        { status: 400 }
      );
    }

    // Insert new category
    const result = await db.collection("inventory_categories").insertOne({
      name: trimmedName,
      description,
      icon: type === "inventory" ? icon : undefined, // only store icon for inventory
      type,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { success: true, id: result.insertedId, category: { _id: result.insertedId, ...data } },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/categories/inventory error:", error);
    return NextResponse.json(
      { error: "Failed to create inventory category" },
      { status: 500 }
    );
  }
}




