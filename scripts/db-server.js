// scripts/db-server.js
const { MongoMemoryServer } = require("mongodb-memory-server");
const path = require("path");
const fs = require("fs");
const { MongoClient } = require("mongodb");
const dummyData = require("./dummy-data");

const dbPath = path.resolve(process.cwd(), ".mongo_data");
if (!fs.existsSync(dbPath)) {
  fs.mkdirSync(dbPath, { recursive: true });
}

async function startServer() {
  console.log("Starting embedded MongoDB server on port 27017...");
  console.log(`Database storage path: ${dbPath}`);

  try {
    const mongod = await MongoMemoryServer.create({
      instance: {
        port: 27017,
        dbPath: dbPath,
        storageEngine: "wiredTiger",
        dbName: "hotel_pos",
      },
      binary: { checkMD5: false },
    });

    const uri = mongod.getUri();
    console.log(`\n==================================================`);
    console.log(`✅ MongoDB Server is LIVE on: ${uri}`);
    console.log(`Port: 27017 | Database: hotel_pos`);
    console.log(`==================================================\n`);

    // Auto-seed database
    console.log("Checking and seeding database with initial master dummy data...");
    await seedDatabase(uri);

    // Keep process alive
    process.on("SIGINT", async () => {
      console.log("\nShutting down embedded MongoDB server...");
      await mongod.stop();
      process.exit(0);
    });

    process.on("SIGTERM", async () => {
      console.log("\nShutting down embedded MongoDB server...");
      await mongod.stop();
      process.exit(0);
    });

  } catch (error) {
    console.error("Error starting MongoDB server:", error);
    process.exit(1);
  }
}

async function seedDatabase(mongoUri) {
  const client = new MongoClient(mongoUri);
  try {
    await client.connect();
    const db = client.db("hotel_pos");

    // Check if already seeded with comprehensive dataset
    const billCount = await db.collection("bills").countDocuments();
    if (billCount > 0) {
      console.log(`Database already has ${billCount} bills and master records. Skipping duplicate seed.`);
      await client.close();
      return;
    }

    console.log("Seeding fresh comprehensive master data across all modules...");

    await db.collection("staff").deleteMany({});
    await db.collection("staff").insertMany(dummyData.staff);

    await db.collection("superadmin").deleteMany({});
    await db.collection("superadmin").insertOne(dummyData.staff[0]);

    await db.collection("outlets").deleteMany({});
    await db.collection("outlets").insertMany(dummyData.outlets);

    await db.collection("tables").deleteMany({});
    await db.collection("tables").insertMany(dummyData.tables);

    await db.collection("categories").deleteMany({});
    await db.collection("categories").insertMany(dummyData.categories);

    await db.collection("menu").deleteMany({});
    await db.collection("menu").insertMany(dummyData.menuItems);

    await db.collection("inventory").deleteMany({});
    await db.collection("inventory").insertMany(dummyData.inventory);

    await db.collection("suppliers").deleteMany({});
    await db.collection("suppliers").insertMany(dummyData.suppliers);

    await db.collection("purchases").deleteMany({});
    await db.collection("purchases").insertMany(dummyData.purchases);

    await db.collection("expenses").deleteMany({});
    await db.collection("expenses").insertMany(dummyData.expenses);

    await db.collection("debtors").deleteMany({});
    await db.collection("debtors").insertMany(dummyData.debtors);

    await db.collection("customers").deleteMany({});
    await db.collection("customers").insertMany(dummyData.customers);

    await db.collection("orders").deleteMany({});
    await db.collection("orders").insertMany(dummyData.sampleOrders);

    await db.collection("bills").deleteMany({});
    await db.collection("bills").insertMany(dummyData.sampleBills);

    await db.collection("payments").deleteMany({});
    await db.collection("payments").insertMany(dummyData.samplePayments);

    await db.collection("register_sessions").deleteMany({});
    await db.collection("register_sessions").insertMany(dummyData.registerSessions);

    await db.collection("feedbacks").deleteMany({});
    await db.collection("feedbacks").insertMany(dummyData.feedbacks);

    await db.collection("taxes").deleteMany({});
    await db.collection("taxes").insertMany(dummyData.taxes);

    await db.collection("settings").deleteMany({});
    await db.collection("settings").insertOne(dummyData.settingsDoc);

    console.log("🎉 All master dummy data seeded successfully into local MongoDB!");
  } catch (err) {
    console.error("Seeding warning/error:", err.message);
  } finally {
    await client.close();
  }
}

startServer();
