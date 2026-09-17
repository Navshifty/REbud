import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { runAnalysis as runAnalysisRequest } from "../../services/analysisService";
import {
  getProjectAnalysis, getProjectSummary, initialState, isAnalysisRunning, workspaceReducer,
} from "./workspaceReducer";

let idCounter = 0;
function nextId(prefix) {
  idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

/*
  Orchestrates workspace state and side effects. Components get plain
  values and callbacks; API calls are delegated to src/services.
*/
export function useWorkspace() {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  // Track which project each in-flight request belongs to, so a result
  // that arrives after the project was deleted is ignored.
  const liveProjects = useRef(new Set(initialState.projects.map((p) => p.id)));

  const activeProjectId = state.activeProjectId;
  const activeProject = state.projects.find((p) => p.id === activeProjectId) ?? null;
  const files = state.filesByProject[activeProjectId] ?? [];
  const analysis = getProjectAnalysis(state, activeProjectId);

  const selectProject = useCallback((id) => dispatch({ type: "SELECT_PROJECT", id }), []);

  const createProject = useCallback(({ name, objective = "" }) => {
    const project = { id: nextId("p"), name: name.trim(), objective: objective.trim(), archived: false, createdAt: Date.now() };
    liveProjects.current.add(project.id);
    dispatch({ type: "CREATE_PROJECT", project });
    return project;
  }, []);

  const updateProject = useCallback((id, patch) => dispatch({ type: "UPDATE_PROJECT", id, patch }), []);

  const setArchived = useCallback((id, archived) => dispatch({ type: "UPDATE_PROJECT", id, patch: { archived } }), []);

  const deleteProject = useCallback((id) => {
    liveProjects.current.delete(id);
    dispatch({ type: "DELETE_PROJECT", id });
  }, []);

  /** Accepts a new array or an updater(prev) => next, scoped to the active project. */
  const setFiles = useCallback((updater) => {
    if (!activeProjectId) return;
    if (typeof updater === "function") dispatch({ type: "SET_FILES", projectId: activeProjectId, updater });
    else dispatch({ type: "SET_FILES", projectId: activeProjectId, files: updater });
  }, [activeProjectId]);

  // Latest state for async callbacks without re-creating them on every render.
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  /** Run every module an action covers, for the active project. */
  const runModules = useCallback(async (modules, projectId = activeProjectId) => {
    if (!projectId) return;
    const projectFiles = stateRef.current.filesByProject[projectId] ?? [];
    const project = stateRef.current.projects.find((p) => p.id === projectId);
    dispatch({ type: "ANALYSIS_START", projectId, modules });
    await Promise.all(
      modules.map(async (module) => {
        try {
          const data = await runAnalysisRequest(module, { project, files: projectFiles });
          if (!liveProjects.current.has(projectId)) return;
          dispatch({ type: "ANALYSIS_SUCCESS", projectId, module, data, updatedAt: Date.now() });
        } catch (err) {
          if (!liveProjects.current.has(projectId)) return;
          dispatch({ type: "ANALYSIS_ERROR", projectId, module, error: err.message || "Analysis failed." });
        }
      }),
    );
  }, [activeProjectId]);

  const summaries = useMemo(
    () => Object.fromEntries(state.projects.map((p) => [p.id, getProjectSummary(state, p.id)])),
    [state],
  );

  return {
    projects: state.projects,
    summaries,
    activeProject,
    activeProjectId,
    activeSummary: summaries[activeProjectId],
    files,
    analysis,
    isRunning: isAnalysisRunning(analysis),
    selectProject,
    createProject,
    updateProject,
    setArchived,
    deleteProject,
    setFiles,
    runModules,
  };
}
