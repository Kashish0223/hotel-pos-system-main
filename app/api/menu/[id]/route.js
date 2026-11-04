import { getDatabase } from "@/lib/db-config";
import { ObjectId } from "mongodb";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g. "ap-south-1"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

export async function GET(request, { params }) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  try {
    if (!id) {
      return Response.json(
        { error: "Menu item ID is required" },
        { status: 400 }
      );
    }
    const db = await getDatabase();

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

    let menuItem;

    // Try to find by string ID first (for items like "salad_001")
    menuItem = await db.collection("menu").findOne({ _id: id });

    // If not found and the ID looks like an ObjectId, try ObjectId format
    if (!menuItem && ObjectId.isValid(id)) {
      menuItem = await db.collection("menu").findOne({ _id: new ObjectId(id) });
    }

    if (!menuItem) {
      return Response.json({ error: "Menu item not found" }, { status: 404 });
    }

    return Response.json(menuItem);
  } catch (error) {
    console.error("Error in menu item API:", error);
    return Response.json(
      {
        error: "Failed to fetch menu item",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const data = await request.json();
    const db = await getDatabase();

    const resolvedParams = await params;
    const id = resolvedParams.id;
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

    const { deletedImages, ...menuData } = data;

    // Parse price to ensure it's stored as a number
    const menuItem = {
      ...menuData,
      price: Number.parseFloat(data.price),
      updatedAt: new Date(),
    };

    let result;
    // Try string ID first
    result = await db
      .collection("menu")
      .updateOne({ _id: id }, { $set: menuItem });

    // If not found and ID looks like ObjectId, try ObjectId format
    if (result.matchedCount === 0 && ObjectId.isValid(id)) {
      result = await db
        .collection("menu")
        .updateOne({ _id: new ObjectId(id) }, { $set: menuItem });
    }

    if (Array.isArray(deletedImages)) {
      for (const url of deletedImages) {
        try {
          const key = url.split(".com/")[1]; // keep the "uploads/" folder
          if (!key) continue;

          await s3.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: key,
            })
          );

          // console.log("Deleted from S3:", key);
        } catch (err) {
          console.warn("Failed to delete from S3:", url, err.message);
        }
      }
    }

    if (result.matchedCount === 0) {
      return Response.json({ error: "Menu item not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Failed to update menu item" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
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
    const db = await getDatabase();
    let result;

    const resolvedParams = await params;
    const id = resolvedParams.id;

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

    // Try string ID first
    result = await db.collection("menu").deleteOne({ _id: id });

    // If not found and ID looks like ObjectId, try ObjectId format
    if (result.deletedCount === 0 && ObjectId.isValid(id)) {
      result = await db.collection("menu").deleteOne({ _id: new ObjectId(id) });
    }

    if (result.deletedCount === 0) {
      return Response.json({ error: "Menu item not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    return Response.json(
      { error: "Failed to delete menu item" },
      { status: 500 }
    );
  }
}
