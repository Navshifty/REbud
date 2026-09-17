import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import * as projectService from "../../services/projectService";
import * as documentService from "../../services/documentService";
import * as analysisService from "../../services/analysisService";
import {
  getProjectAnalysis, getProjectSummary, initialState, isAnalysisRunning, workspaceReducer,
} from "./workspaceReducer";

const POLL_MS = 1500;

let pendingCounter = 0;
const pendingId = () => `pending_${Date.now().toString(36)}_${++pendingCounter}`;

/*
  Orchestrates workspace state and side effects. Components receive plain
  values and callbacks; all I/O goes through src/services (API or mock).
*/
export function useWorkspace() {
  const [state, dispatch] = useReducer(workspaceReducer, initialState);
  const [lastError, setLastError] = useState(null);
  const stateRef = useRef(state);
  useEffect(() => { stateRef.current = state; }, [state]);

  const activeProjectId = state.activeProjectId;
  const activeProject = state.projects.find((p) => p.id === activeProjectId) ?? null;
  const files = state.filesByProject[activeProjectId] ?? [];
  const analysis = getProjectAnalysis(state, activeProjectId);
  const activeLoaded = Boolean(state.loaded[activeProjectId]);

  const fail = useCallback((err, fallback) => {
    setLastError(err?.message || fallback);
    console.error(err);
  }, []);

  /* ---- initial load ---------------------------------------------------- */

  const loadProjects = useCallback(async () => {
    try {
      const projects = await projectService.listProjects();
      dispatch({ type: "SET_PROJECTS", projects });
    } catch (err) {
      dispatch({ type: "LOAD_FAILED", error: err.message || "Couldn't load your projects." });
    }
  }, []);

  useEffect(() => { loadProjects(); }, [loadProjects]);

  /* ---- per-project data ------------------------------------------------ */

  useEffect(() => {
    if (!activeProjectId || state.loaded[activeProjectId]) return;
    let cancelled = false;
    (async () => {
      try {
        const [docs, modules] = await Promise.all([
          documentService.listDocuments(activeProjectId),
          analysisService.getAnalysis(activeProjectId),
        ]);
        if (!cancelled) dispatch({ type: "SET_PROJECT_DATA", projectId: activeProjectId, files: docs, analysis: modules });
      } catch (err) {
        if (!cancelled) fail(err, "Couldn't load this project's documents.");
      }
    })();
    return () => { cancelled = true; };
  }, [activeProjectId, state.loaded, fail]);

  /* ---- poll while analysis is running ---------------------------------- */

  const running = isAnalysisRunning(analysis);
  useEffect(() => {
    if (!activeProjectId || !running) return;
    const projectId = activeProjectId;
    const timer = setInterval(async () => {
      try {
        const modules = await analysisService.getAnalysis(projectId);
        if (stateRef.current.projects.some((p) => p.id === projectId)) {
          dispatch({ type: "SET_ANALYSIS", projectId, modules });
        }
      } catch (err) {
        fail(err, "Lost contact with the analysis service.");
      }
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [activeProjectId, running, fail]);

  /* ---- projects -------------------------------------------------------- */

  const selectProject = useCallback((id) => dispatch({ type: "SELECT_PROJECT", id }), []);

  const createProject = useCallback(async (values) => {
    try {
      const project = await projectService.createProject(values);
      dispatch({ type: "PROJECT_CREATED", project });
      return project;
    } catch (err) {
      fail(err, "Couldn't create the project.");
      return null;
    }
  }, [fail]);

  const updateProject = useCallback(async (id, patch) => {
    try {
      const project = await projectService.updateProject(id, patch);
      dispatch({ type: "PROJECT_UPDATED", project });
    } catch (err) {
      fail(err, "Couldn't update the project.");
    }
  }, [fail]);

  const setArchived = useCallback((id, archived) => updateProject(id, { archived }), [updateProject]);

  const deleteProject = useCallback(async (id) => {
    try {
      await projectService.deleteProject(id);
      dispatch({ type: "PROJECT_DELETED", id });
    } catch (err) {
      fail(err, "Couldn't delete the project.");
    }
  }, [fail]);

  /* ---- documents ------------------------------------------------------- */

  const setFiles = useCallback((projectId, updater) => {
    dispatch({ type: "SET_FILES", projectId, updater });
  }, []);

  /** Optimistically lists the files as "Uploading", then swaps in the stored records. */
  const uploadFiles = useCallback(async (fileList) => {
    const projectId = stateRef.current.activeProjectId;
    if (!projectId) return { rejected: [] };
    const incoming = Array.from(fileList);
    const accepted = [];
    const rejected = [];
    for (const f of incoming) {
      const check = documentService.validateFile(f);
      if (check.ok) accepted.push(f); else rejected.push(check.reason);
    }
    const room = documentService.MAX_FILES - (stateRef.current.filesByProject[projectId]?.length ?? 0);
    const toSend = accepted.slice(0, Math.max(0, room));
    for (const f of accepted.slice(toSend.length)) {
      rejected.push(`"${f.name}" skipped — the ${documentService.MAX_FILES}-file limit was reached.`);
    }
    if (toSend.length === 0) return { rejected };

    const placeholders = toSend.map((f) => documentService.pendingRecord(f, pendingId()));
    setFiles(projectId, (prev) => [...prev, ...placeholders]);

    try {
      const result = await documentService.uploadDocuments(projectId, toSend);
      setFiles(projectId, (prev) => [
        ...prev.filter((d) => !placeholders.some((p) => p.id === d.id)),
        ...result.documents,
      ]);
      return { rejected: [...rejected, ...(result.rejected ?? [])] };
    } catch (err) {
      setFiles(projectId, (prev) => prev.map((d) => (placeholders.some((p) => p.id === d.id) ? { ...d, status: "Failed" } : d)));
      fail(err, "Upload failed.");
      return { rejected };
    }
  }, [setFiles, fail]);

  const removeFile = useCallback(async (docId) => {
    const projectId = stateRef.current.activeProjectId;
    if (!projectId) return;
    const previous = stateRef.current.filesByProject[projectId] ?? [];
    setFiles(projectId, (prev) => prev.filter((d) => d.id !== docId));
    if (docId.startsWith("pending_")) return; // failed placeholder, nothing stored
    try {
      await documentService.deleteDocument(projectId, docId);
    } catch (err) {
      setFiles(projectId, () => previous);
      fail(err, "Couldn't remove the document.");
    }
  }, [setFiles, fail]);

  /* ---- analysis -------------------------------------------------------- */

  const runModules = useCallback(async (modules) => {
    const projectId = stateRef.current.activeProjectId;
    if (!projectId) return;
    // Show "running" immediately; the service response confirms or corrects it.
    const current = getProjectAnalysis(stateRef.current, projectId);
    const optimistic = { ...current };
    for (const m of modules) optimistic[m] = { ...current[m], status: "running", error: null };
    dispatch({ type: "SET_ANALYSIS", projectId, modules: optimistic });
    try {
      const result = await analysisService.runModules(projectId, modules);
      dispatch({ type: "SET_ANALYSIS", projectId, modules: result.modules });
    } catch (err) {
      const reverted = { ...current };
      for (const m of modules) reverted[m] = { ...current[m], status: "error", error: err.message || "Analysis failed." };
      dispatch({ type: "SET_ANALYSIS", projectId, modules: reverted });
    }
  }, []);

  /* ---- derived --------------------------------------------------------- */

  const summaries = useMemo(
    () => Object.fromEntries(state.projects.map((p) => [p.id, getProjectSummary(state, p.id)])),
    [state],
  );

  return {
    status: state.status,
    error: state.error,
    retryLoad: loadProjects,
    lastError,
    dismissError: () => setLastError(null),

    projects: state.projects,
    summaries,
    activeProject,
    activeProjectId,
    activeSummary: summaries[activeProjectId],
    activeLoaded,
    files,
    analysis,
    isRunning: running,

    selectProject,
    createProject,
    updateProject,
    setArchived,
    deleteProject,
    uploadFiles,
    removeFile,
    runModules,
  };
}
