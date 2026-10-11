#!/usr/bin/env node
/*
  Set a local account's password.

  For development only: there is no email-based reset yet, so this is how
  you recover an account on your own machine. The password is bcrypt-hashed
  before it reaches the database and is never stored in plain text.

  Usage:
    node scripts/set-password.js <email> <new-password>   non-interactive
    node scripts/set-password.js <email>                  prompts, input masked

  The prompt needs a real terminal. When stdin is piped or redirected,
  pass the password as the second argument instead.
*/
import readline from "node:readline";
import bcrypt from "bcryptjs";
import { connectDb, disconnectDb } from "../src/db/connect.js";
import { User } from "../src/models/User.js";
import { validatePassword } from "../src/services/auth.service.js";

const email = (process.argv[2] ?? "").trim().toLowerCase();
const inlinePassword = process.argv[3];

if (!email) {
  console.error("Usage: node scripts/set-password.js <email> [new-password]");
  process.exit(1);
}

await connectDb();

const user = await User.findOne({ email });
if (!user) {
  const known = (await User.find().select("email")).map((u) => u.email);
  console.error(`No account found for ${email}.`);
  console.error(`Known accounts: ${known.join(", ") || "none"}`);
  await disconnectDb();
  process.exit(1);
}

/*
  Masked prompt. Overriding _writeToOutput is the supported way to hide
  input: readline keeps ownership of stdin, so this works where attaching
  a second 'data' listener does not (notably Windows terminals).
*/
function askHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error("No interactive terminal. Pass the password as the second argument instead."));
      return;
    }
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    let muted = false;
    rl._writeToOutput = (str) => {
      if (!muted || str.includes(question)) rl.output.write(str);
      else rl.output.write("*");
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
    muted = true;
  });
}

async function readPassword() {
  if (inlinePassword !== undefined) return inlinePassword;
  console.log(`Setting a new password for ${user.name} <${user.email}>.`);
  console.log("Requirement: at least 8 characters.\n");
  const password = await askHidden("New password: ");
  const confirm = await askHidden("Confirm password: ");
  if (confirm !== password) {
    console.error("Passwords do not match.");
    await disconnectDb();
    process.exit(1);
  }
  return password;
}

try {
  const password = await readPassword();
  const problem = validatePassword(password);
  if (problem) {
    console.error(problem);
    await disconnectDb();
    process.exit(1);
  }
  user.passwordHash = await bcrypt.hash(password, 10);
  await user.save();
  console.log(`\nPassword updated for ${user.email}. Log in at http://localhost:5173`);
  if (inlinePassword !== undefined) {
    console.log("Tip: clear it from your shell history (PowerShell: Clear-History).");
  }
} catch (err) {
  console.error(err.message);
  await disconnectDb();
  process.exit(1);
}

await disconnectDb();
process.exit(0);
