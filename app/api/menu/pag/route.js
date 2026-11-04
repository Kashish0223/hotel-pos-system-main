import { getCollection } from "@/lib/db-config";
import { ObjectId } from "mongodb";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const menuCollection = await getCollection("menu");
    const inventoryCollection = await getCollection("inventory");

    // Fetch menu items
    const menuItems = await menuCollection
      .find({})
      .skip(skip)
      .limit(limit)
      .toArray();

    // For retail items with linkedInventory, fetch currentStock
    const enrichedItems = await Promise.all(
      menuItems.map(async (item) => {
        if (item.itemType === "retail" && item.linkedInventory) {
          try {
            const inventory = await inventoryCollection.findOne(
              { _id: new ObjectId(item.linkedInventory) },
              { projection: { currentStock: 1 } }
            );
            return {
              ...item,
              currentStock: inventory?.currentStock ?? 0,
            };
          } catch (e) {
            console.error("Error fetching stock for item:", item._id, e);
            return { ...item, currentStock: 0 };
          }
        }
        return { ...item, currentStock: null }; // non-retail
      })
    );

    const totalItems = await menuCollection.countDocuments({});

    return Response.json({
      items: enrichedItems,
      hasMore: skip + enrichedItems.length < totalItems,
      currentPage: page,
      totalItems,
    });
  } catch (error) {
    console.error("Error in /api/menu/pag GET:", error);
    return Response.json({ error: "Failed to fetch menu items" }, { status: 500 });
  }
}
  // export async function GET(req) {
  //   try {
  //     const { searchParams } = new URL(req.url);
  //     const page = parseInt(searchParams.get("page") || "1", 10);
  //     const limit = parseInt(searchParams.get("limit") || "20", 10);
  //     const skip = (page - 1) * limit;

  //     const collection = await getCollection("menu");

  //     // Get total count for pagination
  //     const totalItems = await collection.countDocuments({});
  //     // const totalItems = 170;
      
  //     const menuItems = await collection
  //       .find({})
  //       .skip(skip)
  //       .limit(limit)   
  //       .toArray();

  //     // Return array with pagination metadata
  //     const response = menuItems;
  //     response.hasMore = skip + menuItems.length < totalItems;
  //     response.currentPage = page;
  //     response.totalItems = totalItems;

  //     return Response.json(response);
  //   } catch (error) {
  //     console.error("Error in /api/menu GET:", error);
  //     return Response.json({ error: "Failed to fetch menu items" }, { status: 500 });
  //   }
  // }
  