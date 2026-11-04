// app/api/orders/dry-run/route.js
import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request) {
  try {
    const { items } = await request.json();

    if (!Array.isArray(items)) {
      return NextResponse.json({ partialAlerts: [] }, { status: 200 });
    }

    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_NAME || 'hotel_pos');
    const partialAlerts = [];

    for (const item of items) {
      if (item.itemType !== 'retail') continue;
      if (!ObjectId.isValid(item._id)) continue;

      const menuDoc = await db.collection('menu').findOne(
        { _id: new ObjectId(item._id) },
        { projection: { name: 1, linkedInventory: 1, currentStock: 1 } }
      );
      if (!menuDoc) continue;

      let available = menuDoc.currentStock ?? 0;
      if (menuDoc.linkedInventory && ObjectId.isValid(menuDoc.linkedInventory)) {
        const inventoryDoc = await db
          .collection('inventory')
          .findOne({ _id: new ObjectId(menuDoc.linkedInventory) }, { projection: { currentStock: 1 } });
        available = inventoryDoc?.currentStock ?? available;
      }

      if (available < item.quantity) {
        partialAlerts.push({
          name: menuDoc.name || item.name,
          requested: item.quantity,
          available,
        });
      }
    }

    return NextResponse.json({ partialAlerts });
  } catch (err) {
    console.error('Dry-run error:', err);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
// // /pages/api/orders/dry-run.js
// import { getMenuItemById } from "@/lib/menu";

// export default async function handler(req, res) {
//   if (req.method !== "POST") return res.status(405).end();

//   const { items } = req.body;
//   const partialAlerts = [];

//   for (const item of items) {
//     if (item.itemType !== "retail") continue;

//     const menuItem = await getMenuItemById(item._id);
//     const available = menuItem?.currentStock ?? 0;

//     if (available < item.quantity) {
//       partialAlerts.push({
//         name: item.name,
//         requested: item.quantity,
//         available,
//       });
//       item.quantity = available; // reduce quantity if not enough stock
//     }
//   }

//   res.status(200).json({ partialAlerts });
// }
