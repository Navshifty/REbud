import { badRequest } from "../lib/errors.js";
import { analyses, documents, projects } from "../lib/store.js";
import { ANALYSIS_MODULES } from "../data/mockAnalysis.js";
import { runModule } from "./pipeline.service.js";
import * as llm from "./llm.service.js";

/*
  Analysis state per project per module:
    { status: "idle" | "running" | "done" | "error", data, error, updatedAt, meta }

  Running a module is asynchronous: the request marks it "running" and a
  background job (pipeline.service) completes it. `meta` records where the
  result came from (model vs sample), which documents were used and token
  usage, so the UI can show provenance.
*/

const IDLE = { status: "idle", data: null, error: null, updatedAt: null, meta: null };

function emptyModules() {
  return Object.fromEntries(ANALYSIS_MODULES.map((m) => [m, { ...IDLE }]));
}

async function ensureRecord(projectId) {
  let record = analyses.byId(projectId);
  if (!record) {
    record = { id: projectId, projectId, modules: emptyModules() };
    await analyses.insert(record);
  }
  return record;
}

export function getAnalysis(projectId) {
  const modules = analyses.byId(projectId)?.modules ?? emptyModules();
  // Older records may lack `meta`; keep the shape uniform for the client.
  return Object.fromEntries(Object.entries(modules).map(([k, v]) => [k, { meta: null, ...v }]));
}

/** What the analysis engine can do right now — surfaced on /api/health. */
export function capabilities() {
  return llm.describe();
}

async function setModule(projectId, module, patch) {
  const record = await ensureRecord(projectId);
  const modules = { ...record.modules, [module]: { ...(record.modules[module] ?? IDLE), ...patch } };
  await analyses.update(projectId, { modules });
  return modules;
}

function runJob(project, module, docs) {
  runModule(module, project, docs)
    .then(({ data, meta }) => {
      if (!projects.byId(project.id)) return; // project deleted while running
      return setModule(project.id, module, { status: "done", data, error: null, updatedAt: Date.now(), meta });
    })
    .catch((err) => {
      if (!projects.byId(project.id)) return;
      console.error(`[analysis] ${module} failed for project ${project.id}:`, err.message);
      return setModule(project.id, module, { status: "error", error: err.message || "Analysis failed." });
    })
    .catch((err) => console.error("analysis job failed to persist", err));
}

/**
 * Start the given modules for a project. Returns the module map after the
 * request has been recorded (running, or error when nothing can be analysed).
 */
export async function runModules(project, modules) {
  if (!Array.isArray(modules) || modules.length === 0) throw badRequest("Provide a non-empty `modules` array.");
  const unknown = modules.filter((m) => !ANALYSIS_MODULES.includes(m));
  if (unknown.length) throw badRequest(`Unknown analysis module(s): ${unknown.join(", ")}.`, { modules: unknown });

  const docs = documents.find((d) => d.projectId === project.id && d.status === "Processed");
  const readable = docs.filter((d) => d.extraction === "extracted");
  let latest = getAnalysis(project.id);

  if (docs.length === 0 || (llm.isConfigured() && readable.length === 0)) {
    const error = docs.length === 0
      ? "No processed documents yet. Upload a document, then run the analysis again."
      : "None of the uploaded documents have readable text. Try re-processing them or uploading a text-based PDF, DOCX, TXT, MD or CSV.";
    for (const m of modules) latest = await setModule(project.id, m, { status: "error", error });
    return { modules: latest, started: false };
  }

  for (const m of modules) {
    if (latest[m]?.status === "running") continue; // already in flight
    latest = await setModule(project.id, m, { status: "running", error: null });
    runJob(project, m, llm.isConfigured() ? readable : docs);
  }
  return { modules: latest, started: true };
}
