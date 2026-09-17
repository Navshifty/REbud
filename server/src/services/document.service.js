import crypto from "node:crypto";
import fsp from "node:fs/promises";
import path from "node:path";
import { config } from "../config.js";
import { badRequest } from "../lib/errors.js";
import { documents } from "../lib/store.js";

/*
  Documents are stored on disk under UPLOAD_DIR as <id>.<ext>; metadata
  lives in the store. Plain-text formats are extracted immediately to
  <id>.txt. PDF and DOCX extraction is a Phase 4 concern, so those
  documents are stored with extraction "pending".
*/

const TEXT_EXTENSIONS = new Set(["txt", "md", "csv"]);

export function extensionOf(name) {
  const parts = String(name).split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function storedPath(doc) {
  return path.join(config.uploadDir, doc.storedName);
}

function textPath(doc) {
  return path.join(config.uploadDir, `${doc.id}.txt`);
}

/** Serialise a document for API responses (no server paths). */
export function publicDocument(doc) {
  const { storedName: _stored, userId: _user, ...safe } = doc;
  return safe;
}

export function listDocuments(projectId) {
  return documents.find((d) => d.projectId === projectId).sort((a, b) => a.createdAt - b.createdAt).map(publicDocument);
}

/**
 * Persist uploaded files (multer memory buffers) for a project.
 * Returns { documents: [...accepted], rejected: [reasons] }.
 */
export async function addDocuments(project, files) {
  if (!files?.length) throw badRequest("No files were uploaded. Send them in the `files` field.");

  const existing = documents.find((d) => d.projectId === project.id).length;
  const room = config.maxFilesPerProject - existing;
  const accepted = [];
  const rejected = [];

  for (const file of files) {
    const ext = extensionOf(file.originalname);
    if (!config.acceptedExtensions.includes(ext)) {
      rejected.push(`"${file.originalname}" is not a supported type. Use PDF, DOCX, TXT, CSV or Markdown.`);
      continue;
    }
    if (file.size > config.maxUploadBytes) {
      rejected.push(`"${file.originalname}" is larger than 25 MB.`);
      continue;
    }
    if (accepted.length >= room) {
      rejected.push(`"${file.originalname}" skipped — the ${config.maxFilesPerProject}-file limit was reached.`);
      continue;
    }

    const id = crypto.randomUUID();
    const doc = {
      id,
      projectId: project.id,
      userId: project.userId,
      name: file.originalname,
      type: ext.toUpperCase(),
      size: formatSize(file.size),
      bytes: file.size,
      status: "Processed",
      storedName: `${id}.${ext}`,
      extraction: TEXT_EXTENSIONS.has(ext) ? "extracted" : "pending",
      chars: 0,
      createdAt: Date.now(),
    };

    await fsp.mkdir(config.uploadDir, { recursive: true });
    await fsp.writeFile(storedPath(doc), file.buffer);

    if (doc.extraction === "extracted") {
      const text = file.buffer.toString("utf8");
      doc.chars = text.length;
      await fsp.writeFile(textPath(doc), text);
    }

    await documents.insert(doc);
    accepted.push(publicDocument(doc));
  }

  return { documents: accepted, rejected };
}

/** Extracted text for a document, or null when extraction is pending. */
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
  const doc = documents.findOne((d) => d.id === docId && d.projectId === project.id);
  if (!doc) return false;
  await unlinkQuietly(storedPath(doc));
  await unlinkQuietly(textPath(doc));
  await documents.remove((d) => d.id === doc.id);
  return true;
}

export async function removeProjectFiles(projectId) {
  const docs = documents.find((d) => d.projectId === projectId);
  for (const doc of docs) {
    await unlinkQuietly(storedPath(doc));
    await unlinkQuietly(textPath(doc));
  }
}
