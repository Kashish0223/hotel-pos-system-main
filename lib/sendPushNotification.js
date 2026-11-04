// lib/sendPushNotification.js
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import webpush from "web-push";

// Configure VAPID
webpush.setVapidDetails(
  'mailto:your-email@domain.com',
  'BPFJrJ_SWQGspsEfyFAXyT6xyNccyOLLbZOY5zS_rBlWaU1T9RrLRrLIbpKolKiKVYew5NyTQXfpftPa_CKVWKI',
  '5MD0Rnr8ZFqQiysNvMRsyteD2AWiBCZthkBsBBQoI3s'
);

export async function sendPushToAuthorizedUsers(payload) {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || "hotel_pos");

    // NEW: Check settings for notifications enabled
    const settings = await db.collection("settings").findOne({ type: "system" });
    // Default to true if setting is missing, so it works for the user immediately
    const pushEnabled = settings?.data?.notifications?.pushNotifications !== false;

    if (!pushEnabled) {
      console.log("Notifications explicitly disabled in settings");
      return { sent: 0, failed: 0, totalTargeted: 0 };
    }
    // 1️⃣ Find all subscriptions for staff with required permissions or superadmins
    const rolesToTarget = ["superadmin", "Manager", "Chef", "Waiter", "Cashier", "Bartender"];
    const permsToTarget = ["manage_orders", "kitchen_display", "view_orders", "*"];

    const query = {
      $or: [
        { permissions: { $in: permsToTarget } },
        { role: { $in: rolesToTarget } },
        // Add case-insensitive role check just in case
        { role: { $in: rolesToTarget.map(r => r.toLowerCase()) } },
        { role: { $in: rolesToTarget.map(r => r.toUpperCase()) } }
      ]
    };
    const subs = await db
      .collection("push_subscriptions")
      .find(query)
      .toArray();

    if (subs.length === 0) {
      return { sent: 0, failed: 0, totalTargeted: 0 };
    }

    console.log(`Found ${subs.length} authorized subscriptions to notify`);

    let sent = 0;
    let failed = 0;

    // 2️⃣ Send push notifications
    for (const sub of subs) {
      try {
        const result = await webpush.sendNotification(
          sub.subscription,
          JSON.stringify({
            title: payload.title || "New Order",
            body: payload.body || "A new order has been placed!",
            icon: payload.icon || "/images/logo.png",
            orderData: payload.data || {},  // Add data
        }));
        console.log(`Push sent successfully to ${sub.userName} (${sub.role}). Status: ${result.statusCode}`);
        sent++;
      } catch (err) {
        failed++;
        console.error(`Push failed for ${sub.userName} (${sub.role}):`, err.message);

        // 3️⃣ Remove expired subscriptions
        if (err.statusCode === 410 || err.statusCode === 404) {
          await db.collection("push_subscriptions").deleteOne({
            _id: new ObjectId(sub._id),
          });
          console.log(`Removed expired subscription ${sub._id}`);
        }
      }
    }

    return { sent, failed, totalTargeted: subs.length };
  } catch (error) {
    console.error("sendPushToAuthorizedUsers failed:", error);
    return { sent: 0, failed: 0, totalTargeted: 0, error: error.message };
  }
}


// Client-side trigger (unchanged — good as is)
export async function sendPushNotificationClient(message = "New order placed!", orderData = {}) {
  try {
    const res = await fetch('/api/sendPushNotification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, data: orderData })
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Server responded ${res.status}: ${errText}`);
    }

    const data = await res.json();
    console.log('Push trigger result:', data);
    return data;
  } catch (err) {
    console.error('Client push trigger error:', err);
    throw err;
  }
}