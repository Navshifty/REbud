import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

dotenv.config();

const serverRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function required(name, fallback) {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable ${name}. See server/.env.example.`);
  }
  return value;
}

const isProduction = process.env.NODE_ENV === "production";

export const config = {
  env: process.env.NODE_ENV ?? "development",
  isProduction,
  port: Number(process.env.PORT ?? 4000),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  // In development a default secret keeps the server runnable out of the box;
  // production must set one explicitly.
  jwtSecret: isProduction ? required("JWT_SECRET") : (process.env.JWT_SECRET ?? "rebud-dev-secret-change-me"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  dataDir: path.resolve(serverRoot, process.env.DATA_DIR ?? "data"),
  uploadDir: path.resolve(serverRoot, process.env.UPLOAD_DIR ?? "uploads"),
  mockAnalysisMs: Number(process.env.MOCK_ANALYSIS_MS ?? 1400),
  maxUploadBytes: 25 * 1024 * 1024,
  maxFilesPerProject: 20,
  acceptedExtensions: ["pdf", "docx", "txt", "csv", "md"],
};
