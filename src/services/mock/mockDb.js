import { FILES_BY_PROJECT, MOCK_ANALYSIS, MOCK_ANALYSIS_BY_PROJECT, PROJECTS, CHAT_TOPICS } from "../../data/mockData";

/*
  In-browser stand-in for the API, used when VITE_API_URL is unset.
  Holds the same records the server would, seeded from mockData, so the
  services can expose one async contract in both modes.
*/

export const ANALYSIS_MODULES = ["overview", "gaps", "novelty", "critique", "relevance", "related", "suggestions"];
const IDLE = { status: "idle", data: null, error: null, updatedAt: null };

let counter = 0;
export const nextId = (prefix) => `${prefix}_${Date.now().toString(36)}_${++counter}`;

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const db = {
  projects: PROJECTS.map((p) => ({ ...p })),
  filesByProject: Object.fromEntries(Object.entries(FILES_BY_PROJECT).map(([k, v]) => [k, v.map((f) => ({ ...f }))])),
  analysisByProject: Object.fromEntries(
    Object.entries(MOCK_ANALYSIS_BY_PROJECT).map(([k, v]) => [k, { ...emptyModules(), ...v }]),
  ),
};

export function emptyModules() {
  return Object.fromEntries(ANALYSIS_MODULES.map((m) => [m, { ...IDLE }]));
}

export function analysisFor(projectId) {
  if (!db.analysisByProject[projectId]) db.analysisByProject[projectId] = emptyModules();
  return db.analysisByProject[projectId];
}

export function filesFor(projectId) {
  if (!db.filesByProject[projectId]) db.filesByProject[projectId] = [];
  return db.filesByProject[projectId];
}

/** Same derivation the server performs. */
export function summarise(project) {
  const files = filesFor(project.id);
  const modules = Object.values(analysisFor(project.id));
  const lastAnalysisAt = modules.reduce((max, m) => (m.updatedAt && m.updatedAt > max ? m.updatedAt : max), 0) || null;
  const gaps = analysisFor(project.id).gaps;
  const gapCount = gaps.status === "done" && Array.isArray(gaps.data) ? gaps.data.length : 0;

  let status = "Draft";
  if (project.archived) status = "Archived";
  else if (modules.some((m) => m.status === "running")) status = "In analysis";
  else if (files.length === 0) status = "Awaiting documents";
  else if (modules.some((m) => m.status === "done")) status = "Analysed";

  return { fileCount: files.length, gapCount, lastAnalysisAt, status };
}

export const clone = (value) => JSON.parse(JSON.stringify(value));

export { MOCK_ANALYSIS, CHAT_TOPICS };
