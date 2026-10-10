#!/usr/bin/env node
/*
  Set a local account's password.

  For development only: there is no email-based reset yet, so this is how
  you recover an account on your own machine. The password is typed into
  this process and hashed with bcrypt before it touches disk; it is never
  echoed, logged or stored in plain text.

  Usage:  node scripts/set-password.js you@example.com
*/
import readline from "node:readline";
import bcrypt from "bcryptjs";
import { users } from "../src/lib/store.js";
import { validatePassword } from "../src/services/auth.service.js";

const email = (process.argv[2] ?? "").trim().toLowerCase();
if (!email) {
  console.error("Usage: node scripts/set-password.js <email>");
  process.exit(1);
}

const user = users.findOne((u) => u.email === email);
if (!user) {
  console.error(`No account found for ${email}.`);
  console.error(`Known accounts: ${users.all().map((u) => u.email).join(", ") || "none"}`);
  process.exit(1);
}

/** Read a line without echoing it to the terminal. */
function askHidden(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const onData = (char) => {
      // Re-write the prompt without the typed characters.
      if (!["\n", "\r", "\u0004"].includes(String(char))) {
        readline.clearLine(process.stdout, 0);
        readline.cursorTo(process.stdout, 0);
        process.stdout.write(question);
      }
    };
    process.stdin.on("data", onData);
    rl.question(question, (answer) => {
      process.stdin.removeListener("data", onData);
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

console.log(`Setting a new password for ${user.name} <${user.email}>.`);
console.log("Requirements: 8+ characters, with an uppercase letter, a lowercase letter and a symbol.\n");

const password = await askHidden("New password: ");
const problem = validatePassword(password);
if (problem) {
  console.error(problem);
  process.exit(1);
}
const confirm = await askHidden("Confirm password: ");
if (confirm !== password) {
  console.error("Passwords do not match.");
  process.exit(1);
}

await users.update(user.id, { passwordHash: await bcrypt.hash(password, 10) });
console.log(`\nDone. Log in at http://localhost:5173 as ${user.email}.`);
process.exit(0);
