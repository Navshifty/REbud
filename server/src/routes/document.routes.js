import { Router } from "express";
import multer from "multer";
import { config } from "../config.js";
import { asyncHandler, notFound } from "../lib/errors.js";
import { addDocuments, listDocuments, removeDocument, reprocessDocument } from "../services/document.service.js";

// Mounted at /api/projects/:projectId/documents with req.project loaded.
const router = Router({ mergeParams: true });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadBytes, files: config.maxFilesPerProject },
});

/** GET → { documents: [...] } */
router.get("/", (req, res) => {
  res.json({ documents: listDocuments(req.project.id) });
});

/** POST multipart `files[]` → 201 { documents: [...accepted], rejected: [...reasons] } */
router.post("/", upload.array("files", config.maxFilesPerProject), asyncHandler(async (req, res) => {
  const result = await addDocuments(req.project, req.files);
  res.status(201).json(result);
}));

/** POST /:documentId/reprocess → { document } — re-run text extraction */
router.post("/:documentId/reprocess", asyncHandler(async (req, res) => {
  res.json({ document: await reprocessDocument(req.project, req.params.documentId) });
}));

/** DELETE /:documentId → 204 */
router.delete("/:documentId", asyncHandler(async (req, res) => {
  const removed = await removeDocument(req.project, req.params.documentId);
  if (!removed) throw notFound("Document not found.");
  res.status(204).end();
}));

export default router;
