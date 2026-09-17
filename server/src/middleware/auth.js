import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { unauthorized } from "../lib/errors.js";
import { users } from "../lib/store.js";

/** Reads `Authorization: Bearer <jwt>`; attaches the user to req.user or 401s. */
export function requireAuth(req, _res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(unauthorized());

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    const user = users.byId(payload.sub);
    if (!user) return next(unauthorized("This account no longer exists."));
    req.user = user;
    return next();
  } catch {
    return next(unauthorized("Your session is invalid or has expired. Please log in again."));
  }
}
