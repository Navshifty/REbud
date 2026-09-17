import { FILES_BY_PROJECT, MOCK_ANALYSIS_BY_PROJECT, PROJECTS } from "../../data/mockData";
import { ANALYSIS_MODULES } from "../../services/analysisService";

/*
  Workspace state: projects, documents per project, and analysis results
  per project per module. Pure reducer — no side effects, no API calls
  (those live in src/services and are orchestrated by useWorkspace).

  analysisByProject[projectId][module] = {
    status: "idle" | "running" | "done" | "error",
    data: object | null,
    error: string | null,
    updatedAt: number | null,
  }
*/

export const IDLE_MODULE = { status: "idle", data: null, error: null, updatedAt: null };

export const initialState = {
  projects: PROJECTS,
  activeProjectId: PROJECTS[0]?.id ?? null,
  filesByProject: FILES_BY_PROJECT,
  analysisByProject: MOCK_ANALYSIS_BY_PROJECT,
};

export function emptyAnalysis() {
  return Object.fromEntries(ANALYSIS_MODULES.map((m) => [m, IDLE_MODULE]));
}

function omit(obj, key) {
  const next = { ...obj };
  delete next[key];
  return next;
}

function setModule(state, projectId, module, patch) {
  const current = state.analysisByProject[projectId] ?? emptyAnalysis();
  return {
    ...state,
    analysisByProject: {
      ...state.analysisByProject,
      [projectId]: { ...current, [module]: { ...(current[module] ?? IDLE_MODULE), ...patch } },
    },
  };
}

export function workspaceReducer(state, action) {
  switch (action.type) {
    case "SELECT_PROJECT":
      return { ...state, activeProjectId: action.id };

    case "CREATE_PROJECT": {
      const { project } = action;
      return {
        ...state,
        projects: [project, ...state.projects],
        activeProjectId: project.id,
        filesByProject: { ...state.filesByProject, [project.id]: [] },
        analysisByProject: { ...state.analysisByProject, [project.id]: emptyAnalysis() },
      };
    }

    case "UPDATE_PROJECT":
      return {
        ...state,
        projects: state.projects.map((p) => (p.id === action.id ? { ...p, ...action.patch } : p)),
      };

    case "DELETE_PROJECT": {
      const projects = state.projects.filter((p) => p.id !== action.id);
      const filesByProject = omit(state.filesByProject, action.id);
      const analysisByProject = omit(state.analysisByProject, action.id);
      const activeProjectId =
        state.activeProjectId === action.id
          ? (projects.find((p) => !p.archived) ?? projects[0])?.id ?? null
          : state.activeProjectId;
      return { ...state, projects, filesByProject, analysisByProject, activeProjectId };
    }

    case "SET_FILES": {
      // Accepts either a new array (`files`) or an updater(prev) => next.
      const prev = state.filesByProject[action.projectId] ?? [];
      const files = typeof action.updater === "function" ? action.updater(prev) : action.files;
      return {
        ...state,
        filesByProject: { ...state.filesByProject, [action.projectId]: files },
      };
    }

    case "ANALYSIS_START": {
      let next = state;
      for (const m of action.modules) next = setModule(next, action.projectId, m, { status: "running", error: null });
      return next;
    }

    case "ANALYSIS_SUCCESS":
      return setModule(state, action.projectId, action.module, {
        status: "done", data: action.data, error: null, updatedAt: action.updatedAt,
      });

    case "ANALYSIS_ERROR":
      return setModule(state, action.projectId, action.module, { status: "error", error: action.error });

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

/** Derived, display-ready facts about a project. */
export function getProjectSummary(state, projectId) {
  const project = state.projects.find((p) => p.id === projectId);
  const files = state.filesByProject[projectId] ?? [];
  const analysis = getProjectAnalysis(state, projectId);
  const modules = Object.values(analysis);

  const lastAnalysisAt = modules.reduce((max, m) => (m.updatedAt && m.updatedAt > max ? m.updatedAt : max), 0) || null;
  const gapCount = analysis.gaps?.status === "done" ? analysis.gaps.data.length : 0;

  let status = "Draft";
  if (project?.archived) status = "Archived";
  else if (isAnalysisRunning(analysis)) status = "In analysis";
  else if (files.length === 0) status = "Awaiting documents";
  else if (modules.some((m) => m.status === "done")) status = "Analysed";

  return { fileCount: files.length, gapCount, lastAnalysisAt, status };
}
