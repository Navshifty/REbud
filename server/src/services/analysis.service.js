import { config } from "../config.js";
import { badRequest } from "../lib/errors.js";
import { analyses, documents, projects } from "../lib/store.js";
import { ANALYSIS_MODULES, MOCK_ANALYSIS } from "../data/mockAnalysis.js";

/*
  Analysis state per project per module:
    { status: "idle" | "running" | "done" | "error", data, error, updatedAt }

  Running a module is asynchronous: the request marks it "running" and a
  background job completes it. Today the job waits and returns canned
  results; Phase 4 replaces `produceResult` with the real pipeline while
  the state machine and API stay the same.
*/

const IDLE = { status: "idle", data: null, error: null, updatedAt: null };

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
  return analyses.byId(projectId)?.modules ?? emptyModules();
}

async function setModule(projectId, module, patch) {
  const record = await ensureRecord(projectId);
  const modules = { ...record.modules, [module]: { ...(record.modules[module] ?? IDLE), ...patch } };
  await analyses.update(projectId, { modules });
  return modules;
}

/** Where the real research-intelligence pipeline will plug in. */
async function produceResult(module, _project, _docs) {
  await new Promise((resolve) => setTimeout(resolve, config.mockAnalysisMs));
  return MOCK_ANALYSIS[module];
}

function runJob(project, module, docs) {
  produceResult(module, project, docs)
    .then((data) => {
      if (!projects.byId(project.id)) return; // project deleted while running
      return setModule(project.id, module, { status: "done", data, error: null, updatedAt: Date.now() });
    })
    .catch((err) => {
      if (!projects.byId(project.id)) return;
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
  let latest = getAnalysis(project.id);

  if (docs.length === 0) {
    const error = "No processed documents yet. Upload a document, then run the analysis again.";
    for (const m of modules) latest = await setModule(project.id, m, { status: "error", error });
    return { modules: latest, started: false };
  }

  for (const m of modules) {
    if (latest[m]?.status === "running") continue; // already in flight
    latest = await setModule(project.id, m, { status: "running", error: null });
    runJob(project, m, docs);
  }
  return { modules: latest, started: true };
}
