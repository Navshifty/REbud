import fs from "node:fs";
import { createApp } from "./app.js";
import { config } from "./config.js";
import { connectDb, disconnectDb } from "./db/connect.js";

fs.mkdirSync(config.uploadDir, { recursive: true });

try {
  await connectDb();
} catch (err) {
  console.error(`Could not connect to MongoDB at ${config.mongoUri}`);
  console.error(err.message);
  console.error("Start MongoDB, or set MONGODB_URI in server/.env");
  process.exit(1);
}

const app = createApp();
const server = app.listen(config.port, () => {
  console.log(`REbud API listening on http://localhost:${config.port} (${config.env})`);
  console.log(`CORS origin: ${config.clientOrigin}`);
});

/* Close the database cleanly so in-flight writes finish. */
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  });
}
