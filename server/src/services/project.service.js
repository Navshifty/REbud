import crypto from "node:crypto";
import { badRequest, requireString } from "../lib/errors.js";
import { analyses, documents, projects } from "../lib/store.js";
import { removeProjectFiles } from "./document.service.js";
import { invalidateCorpus } from "./corpus.service.js";

/*
  Projects belong to a user. `summary` is derived from documents and
  analysis state so the client never has to keep counters in sync.
*/

export function summarise(project) {
  const docs = documents.find((d) => d.projectId === project.id);
  const record = analyses.byId(project.id);
  const modules = record ? Object.values(record.modules) : [];

  const lastAnalysisAt = modules.reduce((max, m) => (m.updatedAt && m.updatedAt > max ? m.updatedAt : max), 0) || null;
  const gaps = record?.modules?.gaps;
  const gapCount = gaps?.status === "done" && Array.isArray(gaps.data) ? gaps.data.length : 0;

  let status = "Draft";
  if (project.archived) status = "Archived";
  else if (modules.some((m) => m.status === "running")) status = "In analysis";
  else if (docs.length === 0) status = "Awaiting documents";
  else if (modules.some((m) => m.status === "done")) status = "Analysed";

  return { fileCount: docs.length, gapCount, lastAnalysisAt, status };
}

export function withSummary(project) {
  return { ...project, summary: summarise(project) };
}

export function listProjects(userId) {
  return projects
    .find((p) => p.userId === userId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .map(withSummary);
}

export async function createProject(userId, body) {
  const name = requireString(body.name, "Project name", { min: 2, max: 120 });
  const objective = typeof body.objective === "string" ? body.objective.trim().slice(0, 1000) : "";
  const now = Date.now();
  const project = { id: crypto.randomUUID(), userId, name, objective, archived: false, createdAt: now, updatedAt: now };
  await projects.insert(project);
  return withSummary(project);
}

export async function updateProject(project, body) {
  const patch = {};
  if (body.name !== undefined) patch.name = requireString(body.name, "Project name", { min: 2, max: 120 });
  if (body.objective !== undefined) {
    if (typeof body.objective !== "string") throw badRequest("Objective must be text.", { field: "objective" });
    patch.objective = body.objective.trim().slice(0, 1000);
  }
  if (body.archived !== undefined) {
    if (typeof body.archived !== "boolean") throw badRequest("archived must be true or false.", { field: "archived" });
    patch.archived = body.archived;
  }
  if (Object.keys(patch).length === 0) throw badRequest("Nothing to update.");
  patch.updatedAt = Date.now();
  const updated = await projects.update(project.id, patch);
  return withSummary(updated);
}

export async function deleteProject(project) {
  invalidateCorpus(project.id);
  await removeProjectFiles(project.id);
  await documents.remove((d) => d.projectId === project.id);
  await analyses.remove((a) => a.projectId === project.id);
  await projects.remove((p) => p.id === project.id);
}
