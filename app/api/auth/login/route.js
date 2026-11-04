// app/api/auth/login/route.js
import { SignJWT } from "jose";
import { getDatabase } from "@/lib/db-config";
import { NextResponse } from "next/server";

import { verifyPassword, hashPassword, sanitizeUser } from "@/lib/finance/security";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);
const EXPIRY = 1 * 24 * 60 * 60; // 1 day in seconds

export async function POST(request) {
  try {
    const { email, password, role } = await request.json();
    const db = await getDatabase();

    let user = null;

    if (role === "superadmin") {
      const SUPER_EMAIL = "superadmin@hotel.com";
      const SUPER_PASS = "superadmin@2024";

      if (email === SUPER_EMAIL && password === SUPER_PASS) {
        user = { _id: "superadmin", name: "Super Admin", email, role: "superadmin", permissions: ["*"], isSuperAdmin: true };
      } else {
        const admin = await db.collection("superadmin").findOne({ email });
        if (admin) {
          const check = verifyPassword(password, admin.password);
          if (check.valid) {
            user = {
              _id: admin._id.toString(),
              name: admin.name,
              email,
              role: "superadmin",
              permissions: admin.permissions || ["*"],
              isSuperAdmin: true,
              status: admin.status || "active",
            };
            if (check.needsUpgrade) {
              db.collection("superadmin").updateOne(
                { _id: admin._id },
                { $set: { password: hashPassword(password), updatedAt: new Date() } }
              ).catch(() => {});
            }
          }
        }
      }
    } else {
      const staff = await db.collection("staff").findOne({ email });
      if (!staff || staff.active === false) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      const check = verifyPassword(password, staff.password);
      if (!check.valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

      user = {
        _id: staff._id.toString(),
        name: staff.name,
        email: staff.email,
        role: staff.role,
        permissions: staff.permissions || [],
        department: staff.department,
        isSuperAdmin: false,
        status: staff.status,
      };

      // Seamlessly upgrade legacy plaintext password to secure hash
      if (check.needsUpgrade) {
        db.collection("staff").updateOne(
          { _id: staff._id },
          { $set: { password: hashPassword(password), updatedAt: new Date() } }
        ).catch(() => {});
      }
    }

    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    // const token = await new SignJWT({ user })
    const token = await new SignJWT({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  permissions: user.permissions,
  isSuperAdmin: user.isSuperAdmin,
})

      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor(Date.now() / 1000) + EXPIRY)
      .sign(secret);

    const response = NextResponse.json({ success: true, user, token });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
