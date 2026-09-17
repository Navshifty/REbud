import { API_ENABLED, request } from "./apiClient";
import { ANALYSIS_MODULES, MOCK_ANALYSIS, analysisFor, clone, db, delay, filesFor } from "./mock/mockDb";

/*
  Research analysis. Module records are
    { status: "idle" | "running" | "done" | "error", data, error, updatedAt }
  runModules starts jobs and resolves immediately with the current module
  map; callers poll getAnalysis while any module is "running".
*/

export { ANALYSIS_MODULES };

const MOCK_LATENCY_MS = 1400;

const mock = {
  async getAnalysis(projectId) {
    await delay(150);
    return clone(analysisFor(projectId));
  },
  async runModules(projectId, modules) {
    await delay(150);
    const analysis = analysisFor(projectId);
    const processed = filesFor(projectId).filter((f) => f.status === "Processed");

    if (processed.length === 0) {
      const error = "No processed documents yet. Upload a document, then run the analysis again.";
      for (const m of modules) analysis[m] = { ...analysis[m], status: "error", error };
      return { modules: clone(analysis), started: false };
    }

    for (const m of modules) {
      if (analysis[m].status === "running") continue;
      analysis[m] = { ...analysis[m], status: "running", error: null };
      setTimeout(() => {
        if (!db.projects.some((p) => p.id === projectId)) return;
        analysis[m] = { status: "done", data: clone(MOCK_ANALYSIS[m]), error: null, updatedAt: Date.now() };
      }, MOCK_LATENCY_MS);
    }
    return { modules: clone(analysis), started: true };
  },
};

const api = {
  async getAnalysis(projectId) {
    const { modules } = await request(`/projects/${projectId}/analysis`);
    return modules;
  },
  async runModules(projectId, modules) {
    return request(`/projects/${projectId}/analysis`, { method: "POST", body: { modules } });
  },
};

const impl = API_ENABLED ? api : mock;

export const getAnalysis = (projectId) => impl.getAnalysis(projectId);
export const runModules = (projectId, modules) => impl.runModules(projectId, modules);

export const isRunning = (modules) => Object.values(modules ?? {}).some((m) => m.status === "running");
