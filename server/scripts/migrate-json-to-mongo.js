#!/usr/bin/env node
/*
  One-off migration: the JSON-file store (server/data/*.json) into MongoDB.

  Idempotent — matches users by email and projects by owner+name, so
  running it twice does not duplicate anything. The JSON files are left
  untouched so you can re-run or compare.

  Usage: node scripts/migrate-json-to-mongo.js [--dry]
*/
import fs from "node:fs";
import path from "node:path";
import { config } from "../src/config.js";
import { connectDb, disconnectDb } from "../src/db/connect.js";
import { User } from "../src/models/User.js";
import { Project } from "../src/models/Project.js";
import { Document } from "../src/models/Document.js";
import { Analysis } from "../src/models/Analysis.js";

const dry = process.argv.includes("--dry");

function readJson(name) {
  try {
    return JSON.parse(fs.readFileSync(path.join(config.dataDir, `${name}.json`), "utf8"));
  } catch (err) {
    if (err.code === "ENOENT") return [];
    throw err;
  }
}

const users = readJson("users");
const projects = readJson("projects");
const documents = readJson("documents");
const analyses = readJson("analyses");

console.log(`Found in JSON: ${users.length} users, ${projects.length} projects, ${documents.length} documents, ${analyses.length} analyses`);
if (dry) console.log("(dry run — nothing will be written)\n");

await connectDb();

const userIdMap = new Map(); // old uuid -> new ObjectId
const projectIdMap = new Map();
let created = { users: 0, projects: 0, documents: 0, analyses: 0 };

for (const u of users) {
  let doc = await User.findOne({ email: u.email });
  if (!doc && !dry) {
    doc = await User.create({
      name: u.name,
      email: u.email,
      passwordHash: u.passwordHash, // already hashed; carried across as-is
      createdAt: u.createdAt ? new Date(u.createdAt) : undefined,
    });
    created.users += 1;
  }
  if (doc) userIdMap.set(u.id, doc._id);
  console.log(`  user ${u.email}: ${doc ? (created.users ? "created" : "exists") : "would create"}`);
}

for (const p of projects) {
  const owner = userIdMap.get(p.userId);
  if (!owner) {
    console.warn(`  ! project "${p.name}" skipped — its owner was not migrated`);
    continue;
  }
  let doc = await Project.findOne({ owner, name: p.name });
  if (!doc && !dry) {
    doc = await Project.create({
      owner,
      name: p.name,
      objective: p.objective ?? "",
      archived: Boolean(p.archived),
      createdAt: p.createdAt ? new Date(p.createdAt) : undefined,
    });
    created.projects += 1;
  }
  if (doc) projectIdMap.set(p.id, doc._id);
  console.log(`  project "${p.name}": ${doc ? "ok" : "would create"}`);
}

for (const d of documents) {
  const project = projectIdMap.get(d.projectId);
  const owner = userIdMap.get(d.userId);
  if (!project || !owner) continue;
  if (await Document.findOne({ project, name: d.name })) continue;
  if (dry) { console.log(`  would migrate document ${d.name}`); continue; }
  await Document.create({
    project,
    owner,
    name: d.name,
    type: String(d.type ?? "").toLowerCase(),
    bytes: d.bytes ?? 1,
    size: d.size ?? "1 KB",
    status: d.status === "Failed" ? "Failed" : "Processed",
    storedName: d.storedName,
    extraction: d.extraction === "extracted" ? "extracted" : "failed",
    extractionError: d.extractionError ?? null,
    extractionMethod: d.extractionMethod ?? null,
    chars: d.chars ?? 0,
    pages: d.pages ?? null,
    createdAt: d.createdAt ? new Date(d.createdAt) : undefined,
  });
  created.documents += 1;
  console.log(`  document "${d.name}" migrated`);
}

for (const a of analyses) {
  const project = projectIdMap.get(a.projectId);
  if (!project) continue;
  if (await Analysis.findOne({ project })) continue;
  if (dry) { console.log("  would migrate one analysis record"); continue; }
  await Analysis.create({ project, modules: { ...Analysis.emptyModules(), ...a.modules } });
  created.analyses += 1;
  console.log("  analysis record migrated");
}

console.log(`\n${dry ? "Would create" : "Created"}: ${created.users} users, ${created.projects} projects, ${created.documents} documents, ${created.analyses} analyses`);
await disconnectDb();
process.exit(0);
