// app/api/sendPushNotification/route.js
import { NextResponse } from 'next/server';
import { sendPushToAuthorizedUsers } from '@/lib/sendPushNotification';

export async function POST(request) {
  try {
    const { message, data } = await request.json();

    const result = await sendPushToAuthorizedUsers({
      title: "New Order Alert",
      body: message || "A new order has been placed!",
      icon: "/logo.png",
      data,
      // You can pass more fields if needed: orderId, totalAmount, etc.
    });

    console.log("User Push Staff",result)
    return NextResponse.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error("Push endpoint error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send notifications" },
      { status: 500 }
    );
  }
}
// import { NextResponse } from 'next/server';
// import { sendPushNotificationClient } from '@/lib/sendPushNotification'; // ← from earlier code

// export async function POST(request) {
//   try {
//     const { subscription, message } = await request.json();

//     // Option 1: Send to one specific subscription (if you passed it)
//     if (subscription) {
//       // This is the old single-user way
//       // But we recommend the permission-based way below instead
//     }

//     // Option 2: Recommended — send to all authorized users (manage_orders + kitchen-display)
//     const result = await sendPushToAuthorizedUsers({
//       title: "New Order Alert",
//       body: message || "A new order has been placed!",
//       icon: "/logo.png",
//       // You can add more like data: { orderId: "..." }
//     });

//     return NextResponse.json({
//       success: true,
//       sent: result.sent,
//       failed: result.failed
//     });

//   } catch (error) {
//     console.error("Push send error:", error);
//     return NextResponse.json(
//       { error: error.message || "Failed to send push" },
//       { status: 500 }
//     );
//   }
// }
// // pages/api/sendPushNotification.js
// import webpush from 'web-push';

// // Set your VAPID keys here (replace with your generated keys)
// webpush.setVapidDetails(
//     'mailto:example@yourdomain.com',
//     'BPFJrJ_SWQGspsEfyFAXyT6xyNccyOLLbZOY5zS_rBlWaU1T9RrLRrLIbpKolKiKVYew5NyTQXfpftPa_CKVWKI',
//     '5MD0Rnr8ZFqQiysNvMRsyteD2AWiBCZthkBsBBQoI3s'
// );

// export default async (req, res) => {
//     if (req.method === 'POST') {
//         try {
//             const { subscription, message } = req.body;

//             const payload = JSON.stringify({
//                 title: "New Order",
//                 body: message,
//             });

//             await webpush.sendNotification(subscription, payload);

//             res.status(200).json({ success: true });
//         } catch (error) {
//             console.error('Error sending push notification', error);
//             res.status(500).json({ success: false, error: 'Internal Server Error' });
//         }
//     } else {
//         res.status(405).json({ success: false, error: 'Method Not Allowed' });
//     }
// };
