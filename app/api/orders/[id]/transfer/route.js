import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import {headers} from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

export async function PUT(request, { params }) {
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
    const { roomNumber } = await request.json()


    const resolvedParams = await params
    const id = resolvedParams.id

    await db.collection("orders").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          transferredToRoom: roomNumber,
          settled: true,
          settledAt: new Date(),
          paymentMethod: "room-charge",
        },
      },
    )

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Failed to transfer order" }, { status: 500 })
  }
}
