import { HttpError } from "../lib/errors.js";
import { config } from "../config.js";

/** 404 for unknown routes. */
export function notFoundHandler(req, res) {
  res.status(404).json({ error: { message: `No route for ${req.method} ${req.originalUrl}` } });
}

/** Central error → JSON translator. Express 5 forwards async rejections here.
    The 4-argument signature is what marks this as error middleware. */
export function errorHandler(err, req, res, _next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: { message: err.message, details: err.details } });
  }
  // multer size / count limits
  if (err?.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({ error: { message: "A file exceeds the 25 MB limit." } });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ error: { message: "Request body is not valid JSON." } });
  }

  console.error(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`, err);
  return res.status(500).json({
    error: { message: config.isProduction ? "Something went wrong." : (err.message || "Internal error") },
  });
}
