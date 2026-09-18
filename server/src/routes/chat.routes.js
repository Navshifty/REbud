import { Router } from "express";
import { asyncHandler } from "../lib/errors.js";
import { reply } from "../services/chat.service.js";

// Mounted at /api/projects/:projectId/chat with req.project loaded.
const router = Router({ mergeParams: true });

/** POST { topic?, messages: [{role, text}] } → { message: {role, text}, grounded } */
router.post("/", asyncHandler(async (req, res) => {
  res.json(await reply(req.project, req.body ?? {}));
}));

export default router;
