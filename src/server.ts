/* eslint-disable @typescript-eslint/no-explicit-any */
import app from "./app";
import config from "./app/config";
import mongoose from "mongoose";
import { createServer, Server } from "http";
import seedSuperAdmin from "./app/DB";
import { initSocketIO } from "./app/utils/socket";

let server: Server;

async function main() {
  try {
    await mongoose.connect(config.database_url as string, {
      dbName: "pmayard",
    });
    console.log("Database connected successfully");

    // Create server once
    server = createServer(app);

    // Start server once
    const serverStartTime = Date.now();
    server.listen(config.port, () => {
      console.log(
        `🚀 Server is running on port ${config.port} and took ${Date.now() - serverStartTime}ms to start`,
      );
    });

    // Initialize socket
    initSocketIO(server);

    // Seed admin user
    seedSuperAdmin().catch((err) =>
      console.error("Super admin seeding error:", err),
    );
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

main();

// Global error handlers
process.on("unhandledRejection", (reason) => {
  console.error("💥 Unhandled Rejection:", reason);
  if (server) server.close(() => process.exit(1));
});

process.on("uncaughtException", (err) => {
  console.error("💥 Uncaught Exception:", err);
  console.error(err.stack);
  process.exit(1);
});
