import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getDatabase } from "@/lib/db-config";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";
import { hashPassword } from "@/lib/finance/security";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

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

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const staff = await db
      .collection("staff")
      .find({}, { projection: { password: 0 } })
      .sort({ name: 1 })
      .toArray();
    return Response.json(Array.isArray(staff) ? staff : []);
  } catch (error) {
    // console.error("GET /api/staff error:", error);
    return Response.json({ error: "Failed to fetch staff" }, { status: 500 });
  }
}

// 📌 POST — create / update staff
export async function POST(request) {
  try {
    const db = await getDatabase();

    // Parse request body safely
    let data;
    try {
      data = await request.json();
    } catch (e) {
      console.error("Invalid JSON body:", e);
      return Response.json({ error: "Invalid JSON body" }, { status: 400 });
    }

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

    // Dry run: only validate email uniqueness
    if (data.dryRun === true) {
      const { email, excludeId } = data;
      if (!email) return Response.json({ valid: true });

      const staffQuery = { email };
      if (excludeId && ObjectId.isValid(excludeId))
        staffQuery._id = { $ne: new ObjectId(excludeId) };

      const staffExists = await db.collection("staff").findOne(staffQuery);
      const superadminExists = await db
        .collection("superadmin")
        .findOne({ email });

      const emailTaken = !!staffExists || !!superadminExists;
      return Response.json({
        valid: !emailTaken,
        error: emailTaken ? "This email is already in use." : null,
      });
    }

    // Validate required fields
    if (!data.name || !data.email || !data.role) {
      return Response.json(
        { error: "Name, email, and role are required" },
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

    // Sanitize and secure data before insert
    const sanitizedData = {
      ...data,
      name: String(data.name),
      email: String(data.email),
      role: String(data.role),
      permissions: finalPermissions,
      password: data.password ? hashPassword(String(data.password)) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert staff
    const result = await db.collection("staff").insertOne(sanitizedData);

    return Response.json({
      success: true,
      id: result.insertedId,
      message: "Staff created successfully",
      permissions: finalPermissions,
    });
  } catch (error) {
    console.error("POST /api/staff unexpected error:", error);
    return Response.json({ error: "Failed to create staff" }, { status: 500 });
  }
}
