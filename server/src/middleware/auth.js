import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { asyncHandler, unauthorized } from "../lib/errors.js";
import { User } from "../models/User.js";

/** Reads `Authorization: Bearer <jwt>`; attaches the user to req.user or 401s. */
export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) throw unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, config.jwtSecret);
  } catch {
    throw unauthorized("Your session is invalid or has expired. Please log in again.");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw unauthorized("This account no longer exists.");
  req.user = user;
  next();
});
