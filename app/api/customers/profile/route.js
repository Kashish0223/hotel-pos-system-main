import { getDatabase } from "@/lib/db-config";
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;

export async function GET() {
  try {
  }catch(error){
    return Response.json({ error: "Failed to fetch customer profile" }, { status: 500 });
  }
}
export async function POST(request) {
  try {
     // 🔐 Decode JWT
        //  const headerList = await headers();
        // const authHeader = headerList.get("Authorization");
    
        // if (!authHeader || !authHeader.startsWith("Bearer ")) {
        //   return Response.json({ error: "No token provided" }, { status: 401 });
        // }
    
        // const token = authHeader.split("Bearer ")[1];
        // let payload;
        // try {
        //   const verified = await jwtVerify(token, secret);
        //   payload = verified.payload;
        // } catch (e) {
        //   console.error("JWT verification failed:", e);
        //   return Response.json(
        //     { error: "Invalid or expired token" },
        //     { status: 401 }
        //   );
        // }
    
        // const tokenRole = payload.role;
        // const tokenPermissions = Array.isArray(payload.permissions)
        //   ? payload.permissions
        //   : [];
        // const isSuperAdmin = payload.isSuperAdmin || false;
    
        // if (!tokenRole)
        //   return Response.json(
        //     { error: "Invalid token (missing role)" },
        //     { status: 401 }
        //   );
    // const { email } = await request.json();
    const data = await request.json();
    const { email } = data;


    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }
    
    // Connect to MongoDB
    const db = await getDatabase();

    // Find customer by email
    let customer = await db.collection("customers").findOne({ email });

    // If customer doesn't exist, create a basic customer record
    if (!customer) {
      const customerData = {
        email,
        name: "Guest",
        phone: "",
        createdAt: new Date(),
        updatedAt: new Date(),
        status: "active",
        membershipTier: "bronze",
        visitCount: 0,
        totalSpent: 0
      };
      
      const result = await db.collection("customers").insertOne(customerData);
      customer = { _id: result.insertedId, ...customerData };
    }

      // // Validate requested permissions (only if not SuperAdmin)
      //   if (!(tokenRole === "superadmin" || isSuperAdmin)) {
      //     const requestedPermissions = Array.isArray(data.permissions)
      //       ? data.permissions
      //       : [];
      //     const forbidden = requestedPermissions.filter(
      //       (p) => !tokenPermissions.includes(p)
      //     );
      //     if (forbidden.length > 0) {
      //       return Response.json(
      //         {
      //           error: `Permission mismatch: You don't have permission: ${forbidden.join(
      //             ", "
      //           )}`,
      //         },
      //         { status: 403 }
      //       );
      //     }
      //   }
    
      //   // Assign default permissions
      //   const defaultPermissions = ROLE_PERMISSIONS[data.role] || [];
      //   let finalPermissions = defaultPermissions.filter((p) => p !== "*");
    
      //   // Merge custom permissions if allowed
      //   if (Array.isArray(data.permissions) && data.permissions.length > 0) {
      //     if (!canManagePermissions(tokenRole, isSuperAdmin)) {
      //       return Response.json(
      //         { error: "Only SuperAdmin can assign or modify permissions" },
      //         { status: 403 }
      //       );
      //     }
      //     finalPermissions = [
      //       ...new Set([...finalPermissions, ...data.permissions]),
      //     ];
      //   }
    
    // Get customer orders - try multiple field combinations to ensure we find orders
    const orders = await db.collection("orders")
      .find({ 
        $or: [
          { customerEmail: email },
          { email: email },
          { "customerInfo.email": email }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();

    return Response.json({ 
      success: true, 
      customer,
      orders
    });
  } catch (error) {
    console.error("Error fetching customer profile:", error);
    return Response.json({ error: "Failed to fetch customer profile" }, { status: 500 });
  }
}