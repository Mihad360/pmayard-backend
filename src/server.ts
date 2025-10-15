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

    // Start HTTP server
    server = createServer(app);
    // Start the server and log the time taken
    const serverStartTime = Date.now();
    server.listen(config.port, () => {
      console.log(
        `🚀 Server is running on port ${config.port} and took ${Date.now() - serverStartTime}ms to start`,
      );
    });

    // Initialize Socket.IO
    initSocketIO(server);

    seedSuperAdmin().catch((err) =>
      console.error("Super admin seeding error:", err),
    );

    server = app.listen(config.port, () => {
      console.log(`app listening on port ${config.port}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

main();

process.on("unhandledRejection", (reason: any, promise) => {
  console.error("💥 Unhandled Rejection detected:");
  console.error("👉 Reason:", reason);
  console.error("👉 Promise:", promise);

  if (server) {
    server.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on("uncaughtException", () => {
  console.log("uncaughtException detected.. shutting down");
  process.exit(1);
});
