import { getDatabase } from "@/lib/db-config"
import { ROLE_PERMISSIONS } from "@/lib/rbac";
import { jwtVerify } from "jose";
import { headers } from "next/headers";

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

const canManagePermissions = (role, isSuperAdmin) =>
  role === "superadmin" || isSuperAdmin;


export async function GET() {
  try {
        // const headerList = await headers();
        // const authHeader = headerList.get("Authorization");
        // console.log("STaff get header:---",authHeader);
    
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
    
    const db = await getDatabase()

    // First try to get the new hotel settings format
    const hotelSettings = await db.collection("settings").findOne({ hotelName: { $exists: true } })
    
    if (hotelSettings) {
      return Response.json(hotelSettings)
    }
    
    // Fall back to the old settings format if new format not found
    const settings = await db.collection("settings").findOne({ type: "system" })

    if (!settings) {
      // Return default settings
      return Response.json({
        hotelName: "Hotel-POS",
        hotelNameJa: "ホテルPOS",
        hotelGroup: "Hotel-POS Management Group",
        hotelGroupJa: "ホテルPOSマネジメントグループ",
        currency: "₹",
        taxRate: 18,
        serviceCharge: 10,
        addresses: [
          {
            location: "Branch 1",
            address: "Main Plaza, Commercial Hub, District 382120",
            email: "contact@hotel-pos.com"
          }
        ],
        defaultLanguage: "en",
        supportedLanguages: ["en", "ja"],
        general: {
          restaurantName: "Hotel Restaurant",
          address: "",
          phone: "",
          email: "",
          currency: "USD",
          timezone: "UTC",
          language: "en",
        },
        pos: {
          taxRate: 0,
          serviceCharge: 0,
          autoGenerateKOT: true,
          soundEnabled: true,
          receiptFooter: "",
        },
        notifications: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications:false,
          lowStockAlerts: true,
          orderAlerts: true,
        },
        integrations: {
          printerIP: "",
          paymentGateway: "",
          emailProvider: "",
        },
      })
    }

    // If old format exists, return it with some default hotel settings
    const combinedSettings = {
      hotelName: "Hotel-POS",
      hotelNameJa: "ホテルPOS",
      hotelGroup: "Hotel-POS Management Group",
      hotelGroupJa: "ホテルPOSマネジメントグループ",
      currency: settings.data?.general?.currency || "₹",
      taxRate: settings.data?.pos?.taxRate || 18,
      serviceCharge: settings.data?.pos?.serviceCharge || 10,
      addresses: [
        {
          location: "Branch 1",
          address: settings.data?.general?.address || "Main Plaza, Commercial Hub 382120",
          email: settings.data?.general?.email || "contact@hotel-pos.com"
        }
      ],
      defaultLanguage: settings.data?.general?.language || "en",
      supportedLanguages: ["en", "ja"],
      ...settings.data
    }
    // console.log("----------------------------------------------->");
    // console.log("combinedSettings------------------->>>",combinedSettings);
    return Response.json(combinedSettings)
  } catch (error) {
    console.error("Error fetching settings:", error)
    return Response.json({ error: "Failed to fetch settings" }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { section, data } = await request.json()
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
    const db = await getDatabase()

    await db.collection("settings").updateOne(
      { type: "system" },
      {
        $set: {
          [`data.${section}`]: data,
          updatedAt: new Date(),
        },
      },
      { upsert: true },
    )

    return Response.json({ success: true })
  } catch (error) {
    return Response.json({ error: "Failed to save settings" }, { status: 500 })
  }
}