import { Router } from "express";
import { asyncHandler } from "../lib/errors.js";
import { getAnalysis, runModules } from "../services/analysis.service.js";

// Mounted at /api/projects/:projectId/analysis with req.project loaded.
const router = Router({ mergeParams: true });

/** GET → { modules: { overview: {status,data,error,updatedAt}, ... } } */
router.get("/", (req, res) => {
  res.json({ modules: getAnalysis(req.project.id) });
});

/**
 * POST { modules: ["gaps", ...] } → 202 { modules, started }
 * Jobs finish in the background; poll GET until no module is "running".
 */
router.post("/", asyncHandler(async (req, res) => {
  const result = await runModules(req.project, req.body?.modules);
  res.status(result.started ? 202 : 200).json(result);
}));

export default router;
