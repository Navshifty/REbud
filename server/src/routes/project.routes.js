import { Router } from "express";
import { asyncHandler } from "../lib/errors.js";
import { requireAuth } from "../middleware/auth.js";
import { loadProject } from "../middleware/loadProject.js";
import { createProject, deleteProject, listProjects, updateProject, withSummary } from "../services/project.service.js";
import documentRoutes from "./document.routes.js";
import analysisRoutes from "./analysis.routes.js";
import chatRoutes from "./chat.routes.js";

const router = Router();
router.use(requireAuth);

/** GET /api/projects → { projects: [...] } (each with a derived `summary`) */
router.get("/", (req, res) => {
  res.json({ projects: listProjects(req.user.id) });
});

/** POST /api/projects { name, objective? } → { project } */
router.post("/", asyncHandler(async (req, res) => {
  const project = await createProject(req.user.id, req.body ?? {});
  res.status(201).json({ project });
}));

/** GET /api/projects/:projectId → { project } */
router.get("/:projectId", loadProject, (req, res) => {
  res.json({ project: withSummary(req.project) });
});

/** PATCH /api/projects/:projectId { name?, objective?, archived? } → { project } */
router.patch("/:projectId", loadProject, asyncHandler(async (req, res) => {
  res.json({ project: await updateProject(req.project, req.body ?? {}) });
}));

/** DELETE /api/projects/:projectId → 204 */
router.delete("/:projectId", loadProject, asyncHandler(async (req, res) => {
  await deleteProject(req.project);
  res.status(204).end();
}));

router.use("/:projectId/documents", loadProject, documentRoutes);
router.use("/:projectId/analysis", loadProject, analysisRoutes);
router.use("/:projectId/chat", loadProject, chatRoutes);

export default router;
