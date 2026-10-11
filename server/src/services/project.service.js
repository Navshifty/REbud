import { badRequest } from "../lib/errors.js";
import { Analysis } from "../models/Analysis.js";
import { Document } from "../models/Document.js";
import { Project } from "../models/Project.js";
import { removeProjectFiles } from "./document.service.js";
import { invalidateCorpus } from "./corpus.service.js";

/*
  Projects belong to a user. The summary is derived from documents and
  analysis state on read, so the client never has to keep counters in
  sync and they can't drift from the underlying records.
*/

export async function summarise(project) {
  const [fileCount, analysis] = await Promise.all([
    Document.countDocuments({ project: project.id }),
    Analysis.findOne({ project: project.id }).lean(),
  ]);

  const modules = analysis ? Object.values(analysis.modules ?? {}) : [];
  const lastAnalysisAt = modules.reduce((max, m) => (m?.updatedAt && m.updatedAt > max ? m.updatedAt : max), 0) || null;
  const gaps = analysis?.modules?.gaps;
  const gapCount = gaps?.status === "done" && Array.isArray(gaps.data) ? gaps.data.length : 0;

  let status = "Draft";
  if (project.archived) status = "Archived";
  else if (modules.some((m) => m?.status === "running")) status = "In analysis";
  else if (fileCount === 0) status = "Awaiting documents";
  else if (modules.some((m) => m?.status === "done")) status = "Analysed";

  return { fileCount, gapCount, lastAnalysisAt, status };
}

export async function withSummary(project) {
  return { ...project.toJSON(), summary: await summarise(project) };
}

export async function listProjects(userId) {
  const projects = await Project.find({ owner: userId }).sort({ createdAt: -1 });
  return Promise.all(projects.map(withSummary));
}

function translateValidation(err) {
  if (err.name === "ValidationError") {
    const first = Object.values(err.errors)[0];
    return badRequest(first.message, { field: first.path });
  }
  return err;
}

export async function createProject(userId, body) {
  try {
    const project = await Project.create({
      owner: userId,
      name: body.name,
      objective: typeof body.objective === "string" ? body.objective : "",
    });
    return withSummary(project);
  } catch (err) {
    throw translateValidation(err);
  }
}

export async function updateProject(project, body) {
  const patch = {};
  if (body.name !== undefined) patch.name = body.name;
  if (body.objective !== undefined) {
    if (typeof body.objective !== "string") throw badRequest("Objective must be text.", { field: "objective" });
    patch.objective = body.objective;
  }
  if (body.archived !== undefined) {
    if (typeof body.archived !== "boolean") throw badRequest("archived must be true or false.", { field: "archived" });
    patch.archived = body.archived;
  }
  if (Object.keys(patch).length === 0) throw badRequest("Nothing to update.");

  try {
    project.set(patch);
    await project.save();
    return withSummary(project);
  } catch (err) {
    throw translateValidation(err);
  }
}

export async function deleteProject(project) {
  invalidateCorpus(project.id);
  await removeProjectFiles(project.id); // unlink from disk before the records go
  await Document.deleteMany({ project: project.id });
  await Analysis.deleteOne({ project: project.id });
  await project.deleteOne();
}
