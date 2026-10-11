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

const cache = new Map(); // collection -> { rows, mtimeMs }
const writeQueues = new Map(); // collection -> Promise chain

function filePath(collection) {
  return path.join(config.dataDir, `${collection}.json`);
}

function mtimeOf(collection) {
  try {
    return fs.statSync(filePath(collection)).mtimeMs;
  } catch (err) {
    if (err.code === "ENOENT") return 0;
    throw err;
  }
}

/*
  Reads are served from memory, but the file is re-read whenever it has
  changed on disk. Without that check a second process (a maintenance
  script, a manual edit) writes a change this process never sees — and
  then silently overwrites it on the next save.
*/
function load(collection) {
  const current = mtimeOf(collection);
  const cached = cache.get(collection);
  if (cached && cached.mtimeMs === current) return cached.rows;

  let rows = [];
  try {
    rows = JSON.parse(fs.readFileSync(filePath(collection), "utf8"));
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
  cache.set(collection, { rows, mtimeMs: current });
  return rows;
}

async function persist(collection) {
  const entry = cache.get(collection);
  const rows = entry?.rows ?? [];
  const run = async () => {
    await fsp.mkdir(config.dataDir, { recursive: true });
    const tmp = `${filePath(collection)}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(rows, null, 2));
    await fsp.rename(tmp, filePath(collection));
    // Record the mtime we just produced, so our own write doesn't look
    // like someone else's change on the next read.
    if (entry) entry.mtimeMs = mtimeOf(collection);
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
      cache.set(collection, { rows: keep, mtimeMs: mtimeOf(collection) });
      if (removed) await persist(collection);
      return removed;
    },
  };
}

export const users = repository("users");
export const projects = repository("projects");
export const documents = repository("documents");
export const analyses = repository("analyses");
