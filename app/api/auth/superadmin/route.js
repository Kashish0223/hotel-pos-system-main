import { getDatabase } from "@/lib/db-config";
import { SignJWT } from "jose";
import { NextResponse } from "next/server";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

// export async function GET(request) {
//   try {
//     const { searchParams } = new URL(request.url);
//     const email = searchParams.get("email");

//     const db = await getDatabase();
//     const superadminCollection = db.collection("superadmin");

//     let result;
//     if (email) {
//       const superadmin = await superadminCollection.findOne(
//         { email },
//         { projection: { password: 0 } } // exclude password
//       );
//       if (!superadmin)
//         return NextResponse.json(
//           { error: "Superadmin not found" },
//           { status: 404 }
//         );
//       result = superadmin;
//     } else {
//       const superadmins = await superadminCollection
//         .find({}, { projection: { password: 0 } })
//         .toArray();
//       result = superadmins;
//     }

//     return NextResponse.json({ success: true, data: result });
//   } catch (error) {
//     console.error("GET /api/superadmin error:", error);
//     return NextResponse.json(
//       { error: "Failed to fetch superadmins" },
//       { status: 500 }
//     );
//   }
// }

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const SUPER_ADMIN_EMAIL = "superadmin@hotel.com";
    const SUPER_ADMIN_PASSWORD = "superadmin@2024";

    let userData;

    if (email === SUPER_ADMIN_EMAIL && password === SUPER_ADMIN_PASSWORD) {
      userData = {
        id: "superadmin",
        name: "Hotel Admin",
        email: SUPER_ADMIN_EMAIL,
        role: "superadmin",
        permissions: ["*"],
        isSuperAdmin: true,
      };
    } else {
      const db = await getDatabase();
      const superadmin = await db.collection("superadmin").findOne({ email });

      if (!superadmin || superadmin.password !== password) {
        return NextResponse.json(
          { error: "Invalid super admin credentials" },
          { status: 401 }
        );
      }

      userData = {
        id: superadmin._id.toString(),
        name: superadmin.name,
        email: superadmin.email,
        role: superadmin.role,
        permissions: superadmin.permissions || ["*"],
        isSuperAdmin: true,
      };
    }

    // 🔥 Create JWT
    const token = await new SignJWT({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
      isSuperAdmin: userData.isSuperAdmin,
      permissions: userData.permissions,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(secret);

    const response = NextResponse.json({
      success: true,
      user: userData,
      token,
    });


    return response;


    // ✅ Return user + token (no cookie needed)
    return NextResponse.json({ success: true, user: userData, token: token });
  } catch (error) {
    console.error("Superadmin login error:", error);
    return NextResponse.json(
      { error: "Authentication failed" },
      { status: 500 }
    );
  }
}
