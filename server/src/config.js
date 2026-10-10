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

  // Research-intelligence pipeline (Phase 4). Without an API key the
  // server serves labelled sample results instead of calling the model.
  anthropicApiKey: process.env.ANTHROPIC_API_KEY ?? "",
  anthropicModel: process.env.ANTHROPIC_MODEL ?? "claude-opus-5",
  analysisEffort: process.env.ANALYSIS_EFFORT ?? "high", // low | medium | high | xhigh | max
  enableWebSearch: process.env.ENABLE_WEB_SEARCH === "true",
  // How much document text to hand the model per analysis request. Beyond
  // this the corpus is narrowed with retrieval instead of sent whole.
  maxContextChars: Number(process.env.MAX_CONTEXT_CHARS ?? 160_000),
  chunkChars: Number(process.env.CHUNK_CHARS ?? 1800),
};

export const llmEnabled = () => Boolean(config.anthropicApiKey);
