// scripts/seed.js
const { MongoClient } = require("mongodb");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const dummyData = require("./dummy-data");

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_pos";
const dbName = process.env.MONGODB_NAME || "hotel_pos";

async function seed() {
  console.log(`Connecting to MongoDB at: ${uri}`);
  let client;
  try {
    client = new MongoClient(uri);
    await client.connect();
    console.log("Connected successfully to MongoDB.");
  } catch (err) {
    console.error("Could not connect to MongoDB:", err.message);
    console.error("\nPlease make sure MongoDB is running or provide your MongoDB Atlas URI in .env.local:");
    console.error('MONGODB_URI="mongodb+srv://<user>:<password>@cluster0.mongodb.net/hotel_pos?retryWrites=true&w=majority"');
    process.exit(1);
  }

  const db = client.db(dbName);

  console.log("\n==========================================");
  console.log("🚀 Starting Full-Spectrum Database Seeding");
  console.log("==========================================");

  // 1. Staff & SuperAdmin
  await db.collection("staff").deleteMany({});
  await db.collection("staff").insertMany(dummyData.staff);
  console.log(`✓ Inserted ${dummyData.staff.length} staff members.`);

  await db.collection("superadmin").deleteMany({});
  await db.collection("superadmin").insertOne(dummyData.staff[0]);
  console.log("✓ Inserted superadmin account.");

  // 2. Outlets
  await db.collection("outlets").deleteMany({});
  await db.collection("outlets").insertMany(dummyData.outlets);
  console.log(`✓ Inserted ${dummyData.outlets.length} hotel outlets.`);

  // 3. Tables
  await db.collection("tables").deleteMany({});
  await db.collection("tables").insertMany(dummyData.tables);
  console.log(`✓ Inserted ${dummyData.tables.length} tables across all dining zones.`);

  // 4. Categories (Menu, Inventory, Supplier)
  await db.collection("categories").deleteMany({});
  await db.collection("categories").insertMany(dummyData.categories);
  console.log(`✓ Inserted ${dummyData.categories.length} category records.`);

  // 5. Menu Items
  await db.collection("menu").deleteMany({});
  await db.collection("menu").insertMany(dummyData.menuItems);
  console.log(`✓ Inserted ${dummyData.menuItems.length} menu items.`);

  // 6. Inventory Items
  await db.collection("inventory").deleteMany({});
  await db.collection("inventory").insertMany(dummyData.inventory);
  console.log(`✓ Inserted ${dummyData.inventory.length} inventory items (with low-stock samples).`);

  // 7. Suppliers
  await db.collection("suppliers").deleteMany({});
  await db.collection("suppliers").insertMany(dummyData.suppliers);
  console.log(`✓ Inserted ${dummyData.suppliers.length} verified vendors/suppliers.`);

  // 8. Purchases / Vendor Bills
  await db.collection("purchases").deleteMany({});
  await db.collection("purchases").insertMany(dummyData.purchases);
  console.log(`✓ Inserted ${dummyData.purchases.length} purchase orders & vendor bills.`);

  // 9. Operational Expenses
  await db.collection("expenses").deleteMany({});
  await db.collection("expenses").insertMany(dummyData.expenses);
  console.log(`✓ Inserted ${dummyData.expenses.length} operational expense records.`);

  // 10. Debtors / Accounts Receivable
  await db.collection("debtors").deleteMany({});
  await db.collection("debtors").insertMany(dummyData.debtors);
  console.log(`✓ Inserted ${dummyData.debtors.length} corporate/VIP debtor ledgers.`);

  // 11. Customers
  await db.collection("customers").deleteMany({});
  await db.collection("customers").insertMany(dummyData.customers);
  console.log(`✓ Inserted ${dummyData.customers.length} loyalty customers.`);

  // 12. Multi-Day Orders
  await db.collection("orders").deleteMany({});
  await db.collection("orders").insertMany(dummyData.sampleOrders);
  console.log(`✓ Inserted ${dummyData.sampleOrders.length} orders across past 7 days.`);

  // 13. Authoritative Bills / Invoices
  await db.collection("bills").deleteMany({});
  await db.collection("bills").insertMany(dummyData.sampleBills);
  console.log(`✓ Inserted ${dummyData.sampleBills.length} authoritative bills (paid, unpaid, split).`);

  // 14. Dedicated Payments & Receipts
  await db.collection("payments").deleteMany({});
  await db.collection("payments").insertMany(dummyData.samplePayments);
  console.log(`✓ Inserted ${dummyData.samplePayments.length} payment receipts (Cash, UPI, Card).`);

  // 15. Register Sessions & Cash Drawer
  await db.collection("register_sessions").deleteMany({});
  await db.collection("register_sessions").insertMany(dummyData.registerSessions);
  console.log(`✓ Inserted ${dummyData.registerSessions.length} register shift sessions (1 closed, 1 open).`);

  // 16. Customer Feedbacks
  await db.collection("feedbacks").deleteMany({});
  await db.collection("feedbacks").insertMany(dummyData.feedbacks);
  console.log(`✓ Inserted ${dummyData.feedbacks.length} guest feedback reviews.`);

  // 17. Taxes
  await db.collection("taxes").deleteMany({});
  await db.collection("taxes").insertMany(dummyData.taxes);
  console.log(`✓ Inserted ${dummyData.taxes.length} tax configuration rates.`);

  // 18. Settings
  await db.collection("settings").deleteMany({});
  await db.collection("settings").insertOne(dummyData.settingsDoc);
  console.log("✓ Inserted master system settings.");

  console.log("\n==========================================");
  console.log("🎉 Complete Master Seeding Finished 100%!");
  console.log("==========================================\n");

  await client.close();
}

seed();
