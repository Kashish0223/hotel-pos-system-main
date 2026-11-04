import clientPromise from "@/lib/mongodb"
import { jwtVerify } from "jose";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { headers } from 'next/headers';

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) => role === "superadmin" || isSuperAdmin;

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
          if (!payload.role) return Response.json({ error: "Invalid token (missing role)" }, { status: 401 });
        } catch (e) {
          // console.error("JWT verification failed:", e);
          return Response.json({ error: "Invalid or expired token from Get" }, { status: 401 });
        }
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get("active")

    const query = activeOnly === "true" ? { active: true } : {}
    const taxes = await db.collection("taxes").find(query).toArray()

    return Response.json(taxes)
  } catch (error) {
    return Response.json({ error: "Failed to fetch taxes" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const client = await clientPromise
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");
    const data = await request.json()
    // console.log(data);
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
          return Response.json({ error: "Invalid or expired token" }, { status: 401 });
        }
    
        const tokenRole = payload.role;
        const tokenPermissions = Array.isArray(payload.permissions) ? payload.permissions : [];
        const isSuperAdmin = payload.isSuperAdmin || false;
    
        if (!tokenRole) return Response.json({ error: "Invalid token (missing role)" }, { status: 401 });
    
            // Validate required fields
            if (!data.name || !data.type  || !data.isGST || !data.gstType) {
              return Response.json({ error: "name, type, isGST, and gstType are required" }, { status: 400 });
            }
        


    const result = await db.collection("taxes").insertOne({
      ...data,
      createdAt: new Date(),
    })

    return Response.json({ success: true, id: result.insertedId })
  } catch (error) {
    return Response.json({ error: "Failed to create tax" }, { status: 500 })
  }
}
