import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { jwtVerify } from "jose";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { headers } from 'next/headers';
import { hashPassword } from "@/lib/finance/security";
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) => role === "superadmin" || isSuperAdmin;

// export async function PUT(request, { params }) {
//   try {
//     const db = await getDatabase();
//     const data = await request.json();

//     // 🔐 Decode JWT
//      const headerList = await headers();
//     const authHeader = headerList.get("Authorization");

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return Response.json({ error: "No token provided" }, { status: 401 });
//     }

//     const token = authHeader.split("Bearer ")[1];
//     let payload;
//     try {
//       const verified = await jwtVerify(token, secret);
//       payload = verified.payload;
//     } catch (e) {
//       return Response.json({ error: "Invalid or expired token" }, { status: 401 });
//     }

//     const tokenRole = payload.role;
//     const tokenPermissions = Array.isArray(payload.permissions) ? payload.permissions : [];
//     const isSuperAdmin = payload.isSuperAdmin || false;

//     const id = params.id;

//     if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid staff ID format" }, { status: 400 });

//     const existingStaff = await db.collection("staff").findOne({ _id: new ObjectId(id) });
//     if (!existingStaff) return Response.json({ error: "Staff member not found" }, { status: 404 });

//     if (!data.name || !data.email || !data.role) {
//       return Response.json({ error: "Name, email, and role are required" }, { status: 400 });
//     }

//     // Only allow modifying permissions if allowed
//     if (JSON.stringify(data.permissions) !== JSON.stringify(existingStaff.permissions)) {
//       if (!canManagePermissions(tokenRole, isSuperAdmin)) {
//         return Response.json({ error: "Only SuperAdmin can modify permissions" }, { status: 403 });
//       }
//       // Validate permissions dynamically
//       try {
//         data.permissions = validatePermissions(data.role, data.permissions, tokenPermissions, isSuperAdmin);
//       } catch (err) {
//         return Response.json({ error: err.message }, { status: 403 });
//       }
//     }

//     // Check email uniqueness if changed
//     if (data.email && data.email !== existingStaff.email) {
//       const emailExists = await db.collection("staff").findOne({ 
//         email: data.email, 
//         _id: { $ne: new ObjectId(id) }
//       });
//       if (emailExists) return Response.json({ error: "Email already exists" }, { status: 409 });
//     }

//     const { _id, ...updateData } = data;
//     updateData.updatedAt = new Date();

//     await db.collection("staff").updateOne(
//       { _id: new ObjectId(id) },
//       { $set: updateData }
//     );

//     return Response.json({ success: true, message: "Staff member updated successfully" });
//   } catch (error) {
//     console.error("Error updating staff member:", error);
//     return Response.json({ error: "Failed to update staff member", details: error.message }, { status: 500 });
//   }
// }

export async function PUT(request, { params }) {
  try {
    const db = await getDatabase();
    const data = await request.json();
    const { id } = await params;

    if (!id || !ObjectId.isValid(id)) {
      return Response.json({ error: "Invalid ID" }, { status: 400 });
    }

    // Auth
    const authHeader = (await headers()).get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json({ error: "No token" }, { status: 401 });
    }

    const token = authHeader.split("Bearer ")[1];
    let payload;
    try {
      const { payload: verified } = await jwtVerify(token, secret);
      payload = verified;
    } catch (e) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const existingStaff = await db.collection("staff").findOne({ _id: new ObjectId(id) });
    if (!existingStaff) {
      return Response.json({ error: "Staff not found" }, { status: 404 });
    }

    if (!data.name || !data.email || !data.role) {
      return Response.json({ error: "Name, email, role required" }, { status: 400 });
    }

    // Enforce correct permissions for the selected role
    const rolePermissions = ROLE_PERMISSIONS[data.role] || [];
    data.permissions = rolePermissions.filter(p => p !== "*");

    // Email uniqueness
    if (data.email !== existingStaff.email) {
      const exists = await db.collection("staff").findOne({
        email: data.email,
        _id: { $ne: new ObjectId(id) }
      });
      if (exists) return Response.json({ error: "Email already in use" }, { status: 409 });
    }

    const { _id, ...updateData } = data;
    if (updateData.password && String(updateData.password).trim() !== "") {
      updateData.password = hashPassword(String(updateData.password));
    } else {
      delete updateData.password;
    }
    updateData.updatedAt = new Date();

    await db.collection("staff").updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    return Response.json({ success: true, message: "Staff updated!" });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const db = await getDatabase();

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
      return Response.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    const tokenRole = payload.role;
    const isSuperAdmin = payload.isSuperAdmin || false;

    if (!canManagePermissions(tokenRole, isSuperAdmin)) {
      return Response.json({ error: "Only SuperAdmin can delete staff members" }, { status: 403 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) return Response.json({ error: "Invalid staff ID" }, { status: 400 });

    const result =await db.collection("staff").deleteOne({ _id: new ObjectId(id) });
     if (result.deletedCount === 0) {
      // ❗ No document found → return 404
      return Response.json({ error: "Staff ID not found" }, { status: 404 });
    }
    
    return Response.json({ success: true, message: "Staff member deleted successfully" });
  } catch (error) {
    console.error("Error deleting staff member:", error);
    return Response.json({ error: "Failed to delete staff member", details: error.message }, { status: 500 });
  }
}

