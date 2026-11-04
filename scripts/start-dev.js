// scripts/start-dev.js
const { spawn } = require("child_process");
const net = require("net");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

/**
 * Check if a TCP port is open and accepting connections
 */
function checkPort(port = 27017, host = "127.0.0.1", timeout = 1000) {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let isOpen = false;

    socket.setTimeout(timeout);
    socket.once("connect", () => {
      isOpen = true;
      socket.destroy();
    });
    socket.once("timeout", () => {
      socket.destroy();
    });
    socket.once("error", () => {
      socket.destroy();
    });
    socket.once("close", () => {
      resolve(isOpen);
    });

    socket.connect(port, host);
  });
}

/**
 * Wait for port to become active with polling
 */
async function waitForPort(port = 27017, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    const open = await checkPort(port);
    if (open) return true;
    await new Promise((res) => setTimeout(res, 500));
  }
  return false;
}

async function main() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/hotel_pos";
  const isLocalMongo = uri.includes("localhost:27017") || uri.includes("127.0.0.1:27017");

  let dbProcess = null;

  if (isLocalMongo) {
    const alreadyRunning = await checkPort(27017);
    if (!alreadyRunning) {
      console.log("\n========================================================");
      console.log("⚡ Auto-starting embedded MongoDB on port 27017...");
      console.log("========================================================");

      dbProcess = spawn(process.execPath, [path.resolve(__dirname, "db-server.js")], {
        stdio: "inherit",
        env: process.env,
      });

      console.log("⏳ Waiting for MongoDB server to become ready...");
      const ready = await waitForPort(27017, 30);
      if (ready) {
        console.log("✅ MongoDB is LIVE and ready!\n");
      } else {
        console.log("⚡ Continuing to Next.js startup...\n");
      }
    } else {
      console.log("\n✅ MongoDB is already active on port 27017.\n");
    }
  } else {
    console.log(`\n☁️ Connected to Cloud MongoDB: ${uri.split("@").pop() || "Atlas"}\n`);
  }

  // Launch Next.js dev server
  const nextBin = path.resolve(__dirname, "../node_modules/.bin/next");
  const nextProcess = spawn(nextBin, ["dev"], {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  const cleanup = () => {
    if (nextProcess && !nextProcess.killed) {
      try { nextProcess.kill("SIGTERM"); } catch (_) { }
    }
    if (dbProcess && !dbProcess.killed) {
      try { dbProcess.kill("SIGTERM"); } catch (_) { }
    }
    process.exit(0);
  };

  process.on("SIGINT", cleanup);
  process.on("SIGTERM", cleanup);
  process.on("exit", cleanup);

  nextProcess.on("exit", (code) => {
    if (dbProcess && !dbProcess.killed) {
      try { dbProcess.kill("SIGTERM"); } catch (_) { }
    }
    process.exit(code || 0);
  });
}

main().catch((err) => {
  console.error("Error in dev runner:", err);
  process.exit(1);
});

