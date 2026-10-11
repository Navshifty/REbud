import mongoose from "mongoose";
import { asyncHandler, notFound } from "../lib/errors.js";
import { Project } from "../models/Project.js";

/*
  For routes under /api/projects/:projectId — loads the project and
  enforces ownership. Responds 404 (not 403) for another user's project,
  and for a malformed id, so project ids can't be probed.
*/
export const loadProject = asyncHandler(async (req, _res, next) => {
  const { projectId } = req.params;
  if (!mongoose.isValidObjectId(projectId)) throw notFound("Project not found.");

  const project = await Project.findOne({ _id: projectId, owner: req.user.id });
  if (!project) throw notFound("Project not found.");
  req.project = project;
  next();
});
