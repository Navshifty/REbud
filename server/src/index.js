import fs from "node:fs";
import { createApp } from "./app.js";
import { config } from "./config.js";

fs.mkdirSync(config.dataDir, { recursive: true });
fs.mkdirSync(config.uploadDir, { recursive: true });

const app = createApp();

app.listen(config.port, () => {
  console.log(`REbud API listening on http://localhost:${config.port} (${config.env})`);
  console.log(`CORS origin: ${config.clientOrigin}`);
});
