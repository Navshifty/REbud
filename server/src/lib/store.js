import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";

/*
  Minimal JSON-file store: one file per collection under DATA_DIR.
  Writes are serialised per collection so concurrent requests don't
  clobber each other. This is intentionally simple for Phase 3; the
  repository functions below are the only code that touches it, so
  swapping in a real database in Phase 5 is a local change.
*/

const cache = new Map(); // collection -> array
const writeQueues = new Map(); // collection -> Promise chain

function filePath(collection) {
  return path.join(config.dataDir, `${collection}.json`);
}

function load(collection) {
  if (cache.has(collection)) return cache.get(collection);
  let rows = [];
  try {
    rows = JSON.parse(fs.readFileSync(filePath(collection), "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  cache.set(collection, rows);
  return rows;
}

async function persist(collection) {
  const rows = cache.get(collection) ?? [];
  const run = async () => {
    await fsp.mkdir(config.dataDir, { recursive: true });
    const tmp = `${filePath(collection)}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(rows, null, 2));
    await fsp.rename(tmp, filePath(collection));
  };
  const previous = writeQueues.get(collection) ?? Promise.resolve();
  const next = previous.then(run, run);
  writeQueues.set(collection, next);
  return next;
}

/** Repository for one collection of objects with an `id` field. */
export function repository(collection) {
  return {
    all() {
      return load(collection);
    },
    find(predicate) {
      return load(collection).filter(predicate);
    },
    findOne(predicate) {
      return load(collection).find(predicate) ?? null;
    },
    byId(id) {
      return load(collection).find((r) => r.id === id) ?? null;
    },
    async insert(row) {
      load(collection).push(row);
      await persist(collection);
      return row;
    },
    async update(id, patch) {
      const rows = load(collection);
      const idx = rows.findIndex((r) => r.id === id);
      if (idx === -1) return null;
      rows[idx] = { ...rows[idx], ...patch };
      await persist(collection);
      return rows[idx];
    },
    async remove(predicate) {
      const rows = load(collection);
      const keep = rows.filter((r) => !predicate(r));
      const removed = rows.length - keep.length;
      cache.set(collection, keep);
      if (removed) await persist(collection);
      return removed;
    },
  };
}

export const users = repository("users");
export const projects = repository("projects");
export const documents = repository("documents");
export const analyses = repository("analyses");
