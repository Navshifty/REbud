import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { badRequest, conflict, unauthorized } from "../lib/errors.js";
import { users } from "../lib/store.js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Strip fields the client must never see. */
export function publicUser(user) {
  const { passwordHash: _hash, ...safe } = user;
  return safe;
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function validatePassword(password) {
  if (typeof password !== "string" || password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(password)) return "Password needs an uppercase letter.";
  if (!/[a-z]/.test(password)) return "Password needs a lowercase letter.";
  if (!/[^A-Za-z0-9]/.test(password)) return "Password needs a special character.";
  return null;
}

export async function signup({ name, email, password }) {
  if (typeof name !== "string" || name.trim().length < 2) throw badRequest("Enter your full name.", { field: "name" });
  if (typeof email !== "string" || !EMAIL_RE.test(email)) throw badRequest("Enter a valid email address.", { field: "email" });
  const pwError = validatePassword(password);
  if (pwError) throw badRequest(pwError, { field: "password" });

  const normalised = email.trim().toLowerCase();
  if (users.findOne((u) => u.email === normalised)) throw conflict("An account with this email already exists.");

  const user = {
    id: crypto.randomUUID(),
    name: name.trim(),
    email: normalised,
    passwordHash: await bcrypt.hash(password, 10),
    createdAt: Date.now(),
  };
  await users.insert(user);
  return { token: issueToken(user), user: publicUser(user) };
}

export async function login({ email, password }) {
  if (typeof email !== "string" || !email) throw badRequest("Email is required.", { field: "email" });
  if (typeof password !== "string" || !password) throw badRequest("Password is required.", { field: "password" });

  const user = users.findOne((u) => u.email === email.trim().toLowerCase());
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw unauthorized("Incorrect email or password.");

  return { token: issueToken(user), user: publicUser(user) };
}
