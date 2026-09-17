import { API_ENABLED, request } from "./apiClient";
import { ApiError } from "./apiClient";
import { db, delay, filesFor, nextId } from "./mock/mockDb";

/*
  Documents. Client-side validation runs in both modes so users get
  instant feedback; the server re-validates in API mode.
  uploadDocuments resolves with { documents: [...accepted], rejected: [...reasons] }.
*/

export const ACCEPTED_EXTENSIONS = ["pdf", "docx", "txt", "csv", "md"];
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",");
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MAX_FILES = 20;

export function fileExtension(name) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop().toLowerCase() : "";
}

export function formatSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/** Returns { ok: true } or { ok: false, reason } for a browser File. */
export function validateFile(file) {
  const ext = fileExtension(file.name);
  if (!ACCEPTED_EXTENSIONS.includes(ext)) {
    return { ok: false, reason: `"${file.name}" is not a supported type. Use PDF, DOCX, TXT, CSV or Markdown.` };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { ok: false, reason: `"${file.name}" is larger than 25 MB.` };
  }
  return { ok: true };
}

/** Placeholder record shown while an upload is in flight. */
export function pendingRecord(file, id) {
  return {
    id,
    name: file.name,
    type: (fileExtension(file.name) || "file").toUpperCase(),
    size: formatSize(file.size),
    status: "Uploading",
  };
}

const mock = {
  async listDocuments(projectId) {
    await delay(200);
    return filesFor(projectId).map((f) => ({ ...f }));
  },
  async uploadDocuments(projectId, files) {
    await delay(1200);
    if (!db.projects.some((p) => p.id === projectId)) throw new ApiError(404, "Project not found.");
    const list = filesFor(projectId);
    const documents = [];
    const rejected = [];
    for (const file of files) {
      const check = validateFile(file);
      if (!check.ok) { rejected.push(check.reason); continue; }
      if (list.length >= MAX_FILES) { rejected.push(`"${file.name}" skipped — the ${MAX_FILES}-file limit was reached.`); continue; }
      const doc = { ...pendingRecord(file, nextId("d")), status: "Processed", createdAt: Date.now() };
      list.push(doc);
      documents.push({ ...doc });
    }
    return { documents, rejected };
  },
  async deleteDocument(projectId, docId) {
    await delay(150);
    db.filesByProject[projectId] = filesFor(projectId).filter((f) => f.id !== docId);
  },
};

const api = {
  async listDocuments(projectId) {
    const { documents } = await request(`/projects/${projectId}/documents`);
    return documents;
  },
  async uploadDocuments(projectId, files) {
    const formData = new FormData();
    for (const file of files) formData.append("files", file, file.name);
    return request(`/projects/${projectId}/documents`, { method: "POST", formData });
  },
  async deleteDocument(projectId, docId) {
    await request(`/projects/${projectId}/documents/${docId}`, { method: "DELETE" });
  },
};

const impl = API_ENABLED ? api : mock;

export const listDocuments = (projectId) => impl.listDocuments(projectId);
export const uploadDocuments = (projectId, files) => impl.uploadDocuments(projectId, files);
export const deleteDocument = (projectId, docId) => impl.deleteDocument(projectId, docId);
