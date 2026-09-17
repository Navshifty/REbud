/*
  Document service — validation and (mock) upload/processing of research
  documents. In Phase 3 `processDocument` becomes the upload + parsing
  API call; the UI contract stays the same.
*/

export const ACCEPTED_EXTENSIONS = ["pdf", "docx", "txt", "csv", "md"];
export const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.map((e) => `.${e}`).join(",");
export const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MB

const MOCK_PROCESSING_MS = 1200;

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

/** Build the document record the workspace stores for an accepted File. */
export function toDocumentRecord(file, id) {
  return {
    id,
    name: file.name,
    type: (fileExtension(file.name) || "file").toUpperCase(),
    size: formatSize(file.size),
    status: "Uploading",
  };
}

/** Simulate upload + parsing. Resolves with the processed record. */
export async function processDocument(record) {
  await new Promise((resolve) => setTimeout(resolve, MOCK_PROCESSING_MS));
  return { ...record, status: "Processed" };
}
