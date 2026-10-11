import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { badRequest, conflict, unauthorized } from "../lib/errors.js";
import { EMAIL_RE, MIN_PASSWORD_LENGTH } from "../lib/validation.js";
import { User } from "../models/User.js";

export { MIN_PASSWORD_LENGTH };

/** Strip fields the client must never see (the schema also does this). */
export function publicUser(user) {
  return user.toJSON ? user.toJSON() : user;
}

function issueToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

/*
  Length is the only requirement. Forced composition rules (an uppercase,
  a symbol) push people toward predictable substitutions without adding
  real strength, which is why NIST SP 800-63B advises against them. A
  length floor is kept because it is the part that resists guessing.
*/
export function validatePassword(password) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  return null;
}

export async function signup({ name, email, password }) {
  if (typeof name !== "string" || name.trim().length < 2) throw badRequest("Enter your full name.", { field: "name" });
  if (typeof email !== "string" || !EMAIL_RE.test(email)) throw badRequest("Enter a valid email address.", { field: "email" });
  const pwError = validatePassword(password);
  if (pwError) throw badRequest(pwError, { field: "password" });

  const normalised = email.trim().toLowerCase();
  if (await User.exists({ email: normalised })) throw conflict("An account with this email already exists.");

  try {
    const user = await User.create({
      name: name.trim(),
      email: normalised,
      passwordHash: await bcrypt.hash(password, 10),
    });
    return { token: issueToken(user), user: publicUser(user) };
  } catch (err) {
    // A unique-index violation can still race past the exists() check.
    if (err.code === 11000) throw conflict("An account with this email already exists.");
    if (err.name === "ValidationError") {
      const first = Object.values(err.errors)[0];
      throw badRequest(first.message, { field: first.path });
    }
    throw err;
  }
}

export async function login({ email, password }) {
  if (typeof email !== "string" || !email) throw badRequest("Email is required.", { field: "email" });
  if (typeof password !== "string" || !password) throw badRequest("Password is required.", { field: "password" });

  // passwordHash is select:false on the schema, so ask for it explicitly.
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+passwordHash");
  // Same message for unknown email and wrong password, so accounts can't be enumerated.
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) throw unauthorized("Incorrect email or password.");

  return { token: issueToken(user), user: publicUser(user) };
}

export function findUserById(id) {
  return User.findById(id);
}
