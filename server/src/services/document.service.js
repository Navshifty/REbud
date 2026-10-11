import crypto from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { badRequest, notFound } from "../lib/errors.js";
import { ACCEPTED_EXTENSIONS, MAX_FILES_PER_PROJECT, MAX_UPLOAD_BYTES } from "../lib/validation.js";
import { Document } from "../models/Document.js";
import { extractText } from "./extraction.service.js";
import { invalidateCorpus } from "./corpus.service.js";

/*
  Documents are stored on disk under UPLOAD_DIR as <id>.<ext>; metadata
  lives in MongoDB. Text is extracted on upload (PDF, DOCX, TXT, MD, CSV)
  to <id>.txt and becomes the evidence base for analysis and chat.
*/

export function extensionOf(name) {
  const parts = String(name).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const storedPath = (doc) => path.join(config.uploadDir, doc.storedName);
const textPath = (doc) => path.join(config.uploadDir, `${doc.id}.txt`);

export const publicDocument = (doc) => doc.toJSON();

export async function listDocuments(projectId) {
  const docs = await Document.find({ project: projectId }).sort({ createdAt: 1 });
  return docs.map(publicDocument);
}

/** Extract text for a stored file and return the fields describing the outcome. */
async function extractInto(storedFile, textFile, name, buffer) {
  try {
    const { text, pages, method } = await extractText(buffer, extensionOf(name));
    await fsp.writeFile(textFile, text);
    return { extraction: "extracted", extractionError: null, extractionMethod: method, chars: text.length, pages };
  } catch (err) {
    return { extraction: "failed", extractionError: err.message || "Text extraction failed.", extractionMethod: null, chars: 0, pages: null };
  }
}

/**
 * Persist uploaded files (multer memory buffers) for a project.
 * Returns { documents: [...accepted], rejected: [reasons] }.
 */
export async function addDocuments(project, files) {
  if (!files?.length) throw badRequest("No files were uploaded. Send them in the `files` field.");

  const existing = await Document.countDocuments({ project: project.id });
  let room = MAX_FILES_PER_PROJECT - existing;
  const accepted = [];
  const rejected = [];

  for (const file of files) {
    const ext = extensionOf(file.originalname);
    if (!ACCEPTED_EXTENSIONS.includes(ext)) {
      rejected.push(`"${file.originalname}" is not a supported type. Use PDF, DOCX, TXT, CSV or Markdown.`);
      continue;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      rejected.push(`"${file.originalname}" is larger than 25 MB.`);
      continue;
    }
    if (room <= 0) {
      rejected.push(`"${file.originalname}" skipped — the ${MAX_FILES_PER_PROJECT}-file limit was reached.`);
      continue;
    }
    room -= 1;

    const id = new crypto.randomUUID().replace(/-/g, "").slice(0, 24);
    const storedName = `${id}.${ext}`;
    await fsp.mkdir(config.uploadDir, { recursive: true });
    await fsp.writeFile(path.join(config.uploadDir, storedName), file.buffer);

    const doc = new Document({
      project: project.id,
      owner: project.owner,
      name: file.originalname,
      type: ext,
      bytes: file.size,
      size: formatSize(file.size),
      storedName,
      extraction: "failed", // replaced below; required by the schema
    });
    doc.set(await extractInto(storedName, textPath(doc), file.originalname, file.buffer));
    await doc.save();
    accepted.push(publicDocument(doc));
  }

  if (accepted.length) invalidateCorpus(project.id);
  return { documents: accepted, rejected };
}

/** Re-run extraction for an existing document (e.g. one uploaded before PDF support). */
export async function reprocessDocument(project, docId) {
  const doc = await Document.findOne({ _id: docId, project: project.id });
  if (!doc) throw notFound("Document not found.");
  const buffer = await fsp.readFile(storedPath(doc));
  doc.set(await extractInto(doc.storedName, textPath(doc), doc.name, buffer));
  await doc.save();
  invalidateCorpus(project.id);
  return publicDocument(doc);
}

/** Extracted text for a document, or null when unavailable. */
export async function readDocumentText(doc) {
  if (doc.extraction !== "extracted") return null;
  try {
    return await fsp.readFile(textPath(doc), "utf8");
  } catch {
    return null;
  }
}

async function unlinkQuietly(p) {
  try {
    await fsp.unlink(p);
  } catch (err) {
    if (err.code !== "ENOENT") throw err;
  }
}

export async function removeDocument(project, docId) {
  const doc = await Document.findOne({ _id: docId, project: project.id });
  if (!doc) return false;
  await unlinkQuietly(storedPath(doc));
  await unlinkQuietly(textPath(doc));
  await doc.deleteOne();
  invalidateCorpus(project.id);
  return true;
}

export async function removeProjectFiles(projectId) {
  for (const doc of await Document.find({ project: projectId })) {
    await unlinkQuietly(storedPath(doc));
    await unlinkQuietly(textPath(doc));
  }
}
