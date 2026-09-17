import express from "express";
import cors from "cors";
import { config } from "./config.js";
import authRoutes from "./routes/auth.routes.js";
import projectRoutes from "./routes/project.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

/* Builds the Express app. Kept separate from index.js so tests can import it. */
export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(cors({ origin: config.clientOrigin }));
  app.use(express.json({ limit: "1mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", env: config.env, time: new Date().toISOString() });
  });

  app.use("/api/auth", authRoutes);
  app.use("/api/projects", projectRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
