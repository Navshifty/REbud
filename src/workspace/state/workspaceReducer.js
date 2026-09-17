import { ANALYSIS_MODULES } from "../../services/analysisService";

/*
  Workspace state: a client-side cache of what the services return.
  Pure reducer — no side effects (those live in useWorkspace).

  analysisByProject[projectId][module] = { status, data, error, updatedAt }
  loaded[projectId] = true once documents + analysis were fetched.
*/

export const IDLE_MODULE = { status: "idle", data: null, error: null, updatedAt: null };

export const initialState = {
  status: "loading", // loading | ready | error
  error: null,
  projects: [],
  activeProjectId: null,
  filesByProject: {},
  analysisByProject: {},
  loaded: {},
};

export function emptyAnalysis() {
  return Object.fromEntries(ANALYSIS_MODULES.map((m) => [m, IDLE_MODULE]));
}

function omit(obj, key) {
  const next = { ...obj };
  delete next[key];
  return next;
}

function firstSelectable(projects) {
  return (projects.find((p) => !p.archived) ?? projects[0])?.id ?? null;
}

export function workspaceReducer(state, action) {
  switch (action.type) {
    case "LOAD_FAILED":
      return { ...state, status: "error", error: action.error };

    case "SET_PROJECTS": {
      const projects = action.projects;
      const stillThere = projects.some((p) => p.id === state.activeProjectId);
      return {
        ...state,
        status: "ready",
        error: null,
        projects,
        activeProjectId: stillThere ? state.activeProjectId : firstSelectable(projects),
      };
    }

    case "SELECT_PROJECT":
      return { ...state, activeProjectId: action.id };

    case "SET_PROJECT_DATA":
      return {
        ...state,
        filesByProject: { ...state.filesByProject, [action.projectId]: action.files },
        analysisByProject: { ...state.analysisByProject, [action.projectId]: action.analysis },
        loaded: { ...state.loaded, [action.projectId]: true },
      };

    case "PROJECT_CREATED":
      return {
        ...state,
        projects: [action.project, ...state.projects],
        activeProjectId: action.project.id,
        filesByProject: { ...state.filesByProject, [action.project.id]: [] },
        analysisByProject: { ...state.analysisByProject, [action.project.id]: emptyAnalysis() },
        loaded: { ...state.loaded, [action.project.id]: true },
      };

    case "PROJECT_UPDATED":
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.project.id ? { ...p, ...action.project } : p)),
      };

    case "PROJECT_DELETED": {
      const projects = state.projects.filter((p) => p.id !== action.id);
      return {
        ...state,
        projects,
        filesByProject: omit(state.filesByProject, action.id),
        analysisByProject: omit(state.analysisByProject, action.id),
        loaded: omit(state.loaded, action.id),
        activeProjectId: state.activeProjectId === action.id ? firstSelectable(projects) : state.activeProjectId,
      };
    }

    case "SET_FILES": {
      // Accepts a new array (`files`) or an updater(prev) => next.
      const prev = state.filesByProject[action.projectId] ?? [];
      const files = typeof action.updater === "function" ? action.updater(prev) : action.files;
      return { ...state, filesByProject: { ...state.filesByProject, [action.projectId]: files } };
    }

    case "SET_ANALYSIS":
      return { ...state, analysisByProject: { ...state.analysisByProject, [action.projectId]: action.modules } };

    default:
      return state;
  }
}

/* ---------------------------------------------------------------------- */
/*  Selectors                                                              */
/* ---------------------------------------------------------------------- */

export function getProjectAnalysis(state, projectId) {
  return state.analysisByProject[projectId] ?? emptyAnalysis();
}

export function isAnalysisRunning(analysis) {
  return Object.values(analysis).some((m) => m.status === "running");
}

/**
 * Display-ready facts about a project. Derived from local documents and
 * analysis when they're loaded (instant updates), otherwise the summary
 * the service returned with the project.
 */
export function getProjectSummary(state, projectId) {
  const project = state.projects.find((p) => p.id === projectId);
  if (!project) return { fileCount: 0, gapCount: 0, lastAnalysisAt: null, status: "Draft" };
  if (!state.loaded[projectId]) {
    return project.summary ?? { fileCount: 0, gapCount: 0, lastAnalysisAt: null, status: project.archived ? "Archived" : "Draft" };
  }

  const files = state.filesByProject[projectId] ?? [];
  const analysis = getProjectAnalysis(state, projectId);
  const modules = Object.values(analysis);

  const lastAnalysisAt = modules.reduce((max, m) => (m.updatedAt && m.updatedAt > max ? m.updatedAt : max), 0) || null;
  const gapCount = analysis.gaps?.status === "done" && Array.isArray(analysis.gaps.data) ? analysis.gaps.data.length : 0;

  let status = "Draft";
  if (project.archived) status = "Archived";
  else if (isAnalysisRunning(analysis)) status = "In analysis";
  else if (files.length === 0) status = "Awaiting documents";
  else if (modules.some((m) => m.status === "done")) status = "Analysed";

  return { fileCount: files.length, gapCount, lastAnalysisAt, status };
}
