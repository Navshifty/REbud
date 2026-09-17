import { notFound } from "../lib/errors.js";
import { projects } from "../lib/store.js";

/*
  For routes under /api/projects/:projectId — loads the project and
  enforces ownership. Responds 404 (not 403) for other users' projects so
  project ids can't be probed.
*/
export function loadProject(req, _res, next) {
  const project = projects.byId(req.params.projectId);
  if (!project || project.userId !== req.user.id) return next(notFound("Project not found."));
  req.project = project;
  return next();
}
